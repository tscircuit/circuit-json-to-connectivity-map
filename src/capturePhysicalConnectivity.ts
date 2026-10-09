import {
  distance,
  pointToSegmentDistance,
  segmentToSegmentMinDistance,
  segmentToCircleMinDistance,
  segmentToBoxMinDistance,
  pointToBoxDistance,
  getBoundsFromPoints,
  getBoundingBox,
  doBoundsOverlap,
  type Bounds,
} from "@tscircuit/math-utils"
import Flatbush from "flatbush"
import type {
  PhysicalConnectivityInput,
  PhysicalConnectivitySnapshot,
  PhysicalConnectivityObstacleShape as Obstacle,
  PhysicalConnectivityPoint as Point,
  PhysicalConnectivityTrace,
  PhysicalConnectivityVia as ViaRoutePoint,
  PhysicalConnectivityWire as WireRoutePoint,
} from "./physical-connectivity-types"

const GEOMETRY_EPSILON_MM = 1e-6

type CopperPrimitive = (
  | { kind: "circle"; center: Point; diameter: number }
  | { kind: "obstacle"; obstacle: Obstacle }
  | { kind: "segment"; start: Point; end: Point; width: number }
) & {
  layers: string[]
  bounds: Bounds
  endpointKey?: string
  bridgeId?: string
}

const getObstaclePolygon = (obstacle: Obstacle): Point[] => {
  const angle = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    { x: -obstacle.width / 2, y: -obstacle.height / 2 },
    { x: obstacle.width / 2, y: -obstacle.height / 2 },
    { x: obstacle.width / 2, y: obstacle.height / 2 },
    { x: -obstacle.width / 2, y: obstacle.height / 2 },
  ].map((point) => ({
    x: obstacle.center.x + point.x * cos - point.y * sin,
    y: obstacle.center.y + point.x * sin + point.y * cos,
  }))
}

const obstacleIsCircular = (obstacle: Obstacle) => {
  const hasCircularShape =
    obstacle.type === "oval" || obstacle.shape === "circle"
  if (!hasCircularShape) return false
  if (Math.abs(obstacle.width - obstacle.height) > GEOMETRY_EPSILON_MM) {
    throw new Error(
      `Physical connectivity does not yet support non-circular oval obstacle ${obstacle.obstacleId ?? "<unknown>"}`,
    )
  }
  return true
}

// math-utils box helpers use axis-aligned boxes. Rotate into the pad's frame.
const toObstacleFrame = (point: Point, obstacle: Obstacle): Point => {
  const angle = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const dx = point.x - obstacle.center.x
  const dy = point.y - obstacle.center.y
  return {
    x: dx * Math.cos(angle) + dy * Math.sin(angle),
    y: -dx * Math.sin(angle) + dy * Math.cos(angle),
  }
}

const distancePointToObstacle = (point: Point, obstacle: Obstacle): number =>
  obstacleIsCircular(obstacle)
    ? Math.max(0, distance(point, obstacle.center) - obstacle.width / 2)
    : pointToBoxDistance(toObstacleFrame(point, obstacle), {
        center: { x: 0, y: 0 },
        width: obstacle.width,
        height: obstacle.height,
      })

const distanceSegmentToObstacle = (
  start: Point,
  end: Point,
  obstacle: Obstacle,
): number =>
  obstacleIsCircular(obstacle)
    ? segmentToCircleMinDistance(start, end, {
        ...obstacle.center,
        radius: obstacle.width / 2,
      })
    : segmentToBoxMinDistance(
        toObstacleFrame(start, obstacle),
        toObstacleFrame(end, obstacle),
        {
          center: { x: 0, y: 0 },
          width: obstacle.width,
          height: obstacle.height,
        },
      )

const distanceObstacleToObstacle = (
  first: Obstacle,
  second: Obstacle,
): number => {
  if (obstacleIsCircular(first))
    return Math.max(
      0,
      distancePointToObstacle(first.center, second) - first.width / 2,
    )
  if (obstacleIsCircular(second))
    return distanceObstacleToObstacle(second, first)
  // Containment has no edge intersection. Otherwise the minimum is on an edge.
  if (distancePointToObstacle(second.center, first) === 0) return 0
  const corners = getObstaclePolygon(first)
  return Math.min(
    ...corners.map((corner, index) =>
      distanceSegmentToObstacle(
        corner,
        corners[(index + 1) % corners.length]!,
        second,
      ),
    ),
  )
}

const expandBounds = (bounds: Bounds, amount: number): Bounds => ({
  minX: bounds.minX - amount,
  minY: bounds.minY - amount,
  maxX: bounds.maxX + amount,
  maxY: bounds.maxY + amount,
})

const getPointBounds = (point: Point): Bounds =>
  getBoundingBox({ center: point, width: 0, height: 0 })

const getObstacleBounds = (obstacle: Obstacle): Bounds =>
  obstacleIsCircular(obstacle)
    ? getBoundingBox({
        center: obstacle.center,
        width: obstacle.width,
        height: obstacle.width,
      })
    : getBoundsFromPoints(getObstaclePolygon(obstacle))! // Four rectangle corners.

const primitivesTouch = (
  first: CopperPrimitive,
  second: CopperPrimitive,
): boolean => {
  if (
    !first.layers.some((layer) => second.layers.includes(layer)) ||
    !doBoundsOverlap(
      expandBounds(first.bounds, GEOMETRY_EPSILON_MM),
      second.bounds,
    )
  )
    return false

  if (first.kind === "obstacle") {
    if (second.kind === "obstacle")
      return (
        distanceObstacleToObstacle(first.obstacle, second.obstacle) <=
        GEOMETRY_EPSILON_MM
      )
    if (second.kind === "segment")
      return (
        distanceSegmentToObstacle(second.start, second.end, first.obstacle) <=
        second.width / 2 + GEOMETRY_EPSILON_MM
      )
    return (
      distancePointToObstacle(second.center, first.obstacle) <=
      second.diameter / 2 + GEOMETRY_EPSILON_MM
    )
  }
  if (second.kind === "obstacle") return primitivesTouch(second, first)
  if (first.kind === "segment") {
    if (second.kind === "segment")
      return (
        segmentToSegmentMinDistance(
          first.start,
          first.end,
          second.start,
          second.end,
        ) <=
        (first.width + second.width) / 2 + GEOMETRY_EPSILON_MM
      )
    return (
      pointToSegmentDistance(second.center, first.start, first.end) <=
      (first.width + second.diameter) / 2 + GEOMETRY_EPSILON_MM
    )
  }
  if (second.kind === "segment") return primitivesTouch(second, first)
  return (
    distance(first.center, second.center) <=
    (first.diameter + second.diameter) / 2 + GEOMETRY_EPSILON_MM
  )
}

class DisjointSet {
  private readonly parent: number[]

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index)
  }

  find(index: number): number {
    const parent = this.parent[index]!
    if (parent === index) return index
    const root = this.find(parent)
    this.parent[index] = root
    return root
  }

  union(first: number, second: number) {
    const firstRoot = this.find(first)
    const secondRoot = this.find(second)
    if (firstRoot !== secondRoot) this.parent[secondRoot] = firstRoot
  }
}

const getBoardLayers = (layerCount: number) => {
  if (layerCount <= 1) return ["top"]
  if (layerCount === 2) return ["top", "bottom"]
  return [
    "top",
    ...Array.from(
      { length: layerCount - 2 },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
}

const getViaLayers = (via: ViaRoutePoint, boardLayers: string[]) => {
  if (
    !via.layers?.length ||
    !via.layers.includes(via.from_layer) ||
    !via.layers.includes(via.to_layer) ||
    via.layers.some((layer) => !boardLayers.includes(layer))
  ) {
    throw new Error(
      "Via requires explicit physical layers containing its routing endpoints",
    )
  }
  return via.layers
}

const createBridgeContact = (
  point: Point,
  diameter: number,
  layers: string[],
  bridgeId: string,
): CopperPrimitive => ({
  kind: "circle",
  center: { x: point.x, y: point.y },
  diameter,
  layers,
  bridgeId,
  bounds: expandBounds(getPointBounds(point), diameter / 2),
})

type JumperRoutePoint = Extract<
  PhysicalConnectivityTrace["route"][number],
  { route_type: "jumper" }
>

const wireSegmentMatchesJumper = (
  start: WireRoutePoint,
  end: WireRoutePoint,
  jumper: JumperRoutePoint,
) => {
  if (start.layer !== jumper.layer || end.layer !== jumper.layer) return false
  const pointMatches = (first: Point, second: Point) =>
    distance(first, second) <= GEOMETRY_EPSILON_MM
  const forward =
    pointMatches(start, jumper.start) && pointMatches(end, jumper.end)
  const reverse =
    pointMatches(start, jumper.end) && pointMatches(end, jumper.start)
  return forward || reverse
}

const extractTraceCopper = (
  trace: PhysicalConnectivityTrace,
  boardLayers: string[],
  defaultViaDiameter: number,
  sameNetObstacles: Obstacle[],
): CopperPrimitive[] => {
  const primitives: CopperPrimitive[] = []
  const jumpers = trace.route.flatMap((routePoint, routePointIndex) =>
    routePoint.route_type === "jumper" ? [{ routePoint, routePointIndex }] : [],
  )
  const jumperByWireEndIndex = new Map<number, (typeof jumpers)[number]>()
  for (const jumper of jumpers) {
    const matchingWireEndIndices: number[] = []
    for (let routeIndex = 1; routeIndex < trace.route.length; routeIndex++) {
      const start = trace.route[routeIndex - 1]
      const end = trace.route[routeIndex]
      if (
        start?.route_type === "wire" &&
        end?.route_type === "wire" &&
        wireSegmentMatchesJumper(start, end, jumper.routePoint)
      ) {
        matchingWireEndIndices.push(routeIndex)
      }
    }
    if (matchingWireEndIndices.length > 1) {
      throw new Error(
        `Jumper ${trace.pcb_trace_id}:${jumper.routePointIndex} matched ${matchingWireEndIndices.length} placeholder wire segments`,
      )
    }
    // Inline bridge markers need no placeholder. Appended markers explicitly
    // identify an insulated wire span by its endpoints and layer.
    if (matchingWireEndIndices.length === 0) continue
    const wireEndIndex = matchingWireEndIndices[0]!
    if (jumperByWireEndIndex.has(wireEndIndex)) {
      throw new Error(
        `Multiple jumpers matched placeholder segment ${wireEndIndex} on ${trace.pcb_trace_id}`,
      )
    }
    jumperByWireEndIndex.set(wireEndIndex, jumper)
  }
  let previousWire: WireRoutePoint | undefined
  for (
    let routePointIndex = 0;
    routePointIndex < trace.route.length;
    routePointIndex++
  ) {
    const routePoint = trace.route[routePointIndex]!
    if (routePoint.route_type === "wire") {
      if (
        previousWire &&
        previousWire.layer === routePoint.layer &&
        distance(previousWire, routePoint) > GEOMETRY_EPSILON_MM
      ) {
        const segmentStart = previousWire
        const jumper = jumperByWireEndIndex.get(routePointIndex)
        if (jumper) {
          // The explicit jumper identifies this span as insulated, not copper.
        } else {
          const radius = segmentStart.width / 2
          primitives.push({
            kind: "segment",
            start: { x: segmentStart.x, y: segmentStart.y },
            end: { x: routePoint.x, y: routePoint.y },
            width: segmentStart.width,
            layers: [segmentStart.layer],
            bounds: expandBounds(
              {
                minX: Math.min(segmentStart.x, routePoint.x),
                minY: Math.min(segmentStart.y, routePoint.y),
                maxX: Math.max(segmentStart.x, routePoint.x),
                maxY: Math.max(segmentStart.y, routePoint.y),
              },
              radius,
            ),
          })
        }
      }
      previousWire = routePoint
      continue
    }
    previousWire = undefined
    if (routePoint.route_type === "via") {
      const previousRoutePoint = trace.route[routePointIndex - 1]
      const nextRoutePoint = trace.route[routePointIndex + 1]
      for (const adjacent of [previousRoutePoint, nextRoutePoint]) {
        if (
          adjacent?.route_type === "wire" &&
          distance(adjacent, routePoint) > GEOMETRY_EPSILON_MM
        ) {
          throw new Error(
            `Via ${trace.pcb_trace_id}:${routePointIndex} is adjacent to a non-colocated wire endpoint`,
          )
        }
      }
      const diameter = routePoint.via_diameter ?? defaultViaDiameter
      primitives.push({
        kind: "circle",
        center: { x: routePoint.x, y: routePoint.y },
        diameter,
        layers: getViaLayers(routePoint, boardLayers),
        bounds: expandBounds(getPointBounds(routePoint), diameter / 2),
      })
      continue
    }

    const bridgeId = `${trace.pcb_trace_id}:${routePointIndex}:${routePoint.route_type}`
    if (routePoint.route_type === "jumper") {
      primitives.push(
        createBridgeContact(routePoint.start, 0, [routePoint.layer], bridgeId),
        createBridgeContact(routePoint.end, 0, [routePoint.layer], bridgeId),
      )
      continue
    }
    if (routePoint.route_type === "through_obstacle") {
      const witness = sameNetObstacles.find(
        (obstacle) =>
          obstacle.layers.includes(routePoint.from_layer) &&
          obstacle.layers.includes(routePoint.to_layer) &&
          distancePointToObstacle(routePoint.start, obstacle) <=
            GEOMETRY_EPSILON_MM &&
          distancePointToObstacle(routePoint.end, obstacle) <=
            GEOMETRY_EPSILON_MM,
      )
      if (!witness) {
        throw new Error(
          `Through-obstacle marker ${bridgeId} has no same-net multilayer obstacle witness`,
        )
      }
      primitives.push(
        createBridgeContact(
          routePoint.start,
          0,
          [routePoint.from_layer],
          bridgeId,
        ),
        createBridgeContact(routePoint.end, 0, [routePoint.to_layer], bridgeId),
      )
      continue
    }

    const unsupportedRoutePoint: never = routePoint
    throw new Error(
      `Unsupported route primitive: ${String((unsupportedRoutePoint as { route_type?: unknown }).route_type)}`,
    )
  }
  return primitives
}

/**
 * Capture physical terminal components from copper geometry on the same resolved
 * electrical net. This does not infer intended nets or check inter-net shorts.
 * Wire width belongs to the first point of each segment (Circuit JSON semantics).
 * Unsupported geometry throws; callers decide whether to reject or roll back.
 */
export const capturePhysicalConnectivity = (
  input: PhysicalConnectivityInput,
): PhysicalConnectivitySnapshot => {
  const boardLayers = getBoardLayers(input.layerCount)
  const primitivesByNet = new Map<string, CopperPrimitive[]>()
  const obstaclesByNet = new Map<string, Obstacle[]>()
  const endpointLabels: Record<string, string> = Object.create(null)

  const addPrimitive = (netName: string, primitive: CopperPrimitive) => {
    const primitives = primitivesByNet.get(netName) ?? []
    primitives.push(primitive)
    primitivesByNet.set(netName, primitives)
  }

  for (const endpoint of input.endpoints) {
    if (Object.hasOwn(endpointLabels, endpoint.endpointKey)) {
      throw new Error(`Duplicate physical endpoint key ${endpoint.endpointKey}`)
    }
    const endpointLabel = endpoint.endpointLabel ?? endpoint.endpointKey
    endpointLabels[endpoint.endpointKey] = endpointLabel
    addPrimitive(endpoint.netName, {
      kind: "circle",
      endpointKey: endpoint.endpointKey,
      center: { ...endpoint.point },
      diameter: 0,
      layers: endpoint.layers,
      bounds: getPointBounds(endpoint.point),
    })
  }

  for (const obstacle of input.obstacles) {
    const netNames = [...new Set(obstacle.netNames)].filter((netName) =>
      primitivesByNet.has(netName),
    )
    if (netNames.length === 0) continue
    const primitive: CopperPrimitive = {
      kind: "obstacle",
      obstacle,
      layers: obstacle.layers,
      bounds: getObstacleBounds(obstacle),
    }
    for (const netName of netNames) {
      const obstacles = obstaclesByNet.get(netName) ?? []
      obstacles.push(obstacle)
      obstaclesByNet.set(netName, obstacles)
      addPrimitive(netName, primitive)
    }
  }

  for (const trace of input.traces) {
    if (!primitivesByNet.has(trace.netName)) continue
    const sameNetObstacles = obstaclesByNet.get(trace.netName) ?? []
    const copper = extractTraceCopper(
      trace,
      boardLayers,
      input.defaultViaDiameter,
      sameNetObstacles,
    )
    for (const primitive of copper) addPrimitive(trace.netName, primitive)
  }

  const componentByEndpointKey: Record<string, string> = Object.create(null)
  const endpointComponents: string[][] = []
  for (const primitives of primitivesByNet.values()) {
    const connectedCopper = new DisjointSet(primitives.length)
    const firstContactByBridgeId = new Map<string, number>()
    for (let index = 0; index < primitives.length; index++) {
      const primitive = primitives[index]!
      if (primitive.bridgeId === undefined) continue
      const firstIndex = firstContactByBridgeId.get(primitive.bridgeId)
      if (firstIndex === undefined) {
        firstContactByBridgeId.set(primitive.bridgeId, index)
      } else {
        connectedCopper.union(firstIndex, index)
      }
    }

    const spatialIndex =
      primitives.length > 0 ? new Flatbush(primitives.length) : null
    if (spatialIndex) {
      for (const primitive of primitives) {
        spatialIndex.add(
          primitive.bounds.minX,
          primitive.bounds.minY,
          primitive.bounds.maxX,
          primitive.bounds.maxY,
        )
      }
      spatialIndex.finish()
    }
    for (let firstIndex = 0; firstIndex < primitives.length; firstIndex++) {
      const first = primitives[firstIndex]!
      const candidates =
        spatialIndex?.search(
          first.bounds.minX - GEOMETRY_EPSILON_MM,
          first.bounds.minY - GEOMETRY_EPSILON_MM,
          first.bounds.maxX + GEOMETRY_EPSILON_MM,
          first.bounds.maxY + GEOMETRY_EPSILON_MM,
        ) ?? []
      for (const secondIndex of candidates) {
        if (secondIndex <= firstIndex) continue
        if (primitivesTouch(first, primitives[secondIndex]!)) {
          connectedCopper.union(firstIndex, secondIndex)
        }
      }
    }

    const endpointsByRoot = new Map<number, string[]>()
    for (let index = 0; index < primitives.length; index++) {
      const primitive = primitives[index]!
      if (primitive.endpointKey === undefined) continue
      const root = connectedCopper.find(index)
      const endpointKeys = endpointsByRoot.get(root) ?? []
      endpointKeys.push(primitive.endpointKey)
      endpointsByRoot.set(root, endpointKeys)
    }
    for (const endpointKeys of endpointsByRoot.values()) {
      endpointKeys.sort()
      const componentId = endpointKeys[0]!
      endpointComponents.push(endpointKeys)
      for (const endpointKey of endpointKeys) {
        if (componentByEndpointKey[endpointKey] !== undefined) {
          throw new Error(
            `Endpoint ${endpointKey} was assigned to multiple canonical nets`,
          )
        }
        componentByEndpointKey[endpointKey] = componentId
      }
    }
  }

  endpointComponents.sort(([first = ""], [second = ""]) =>
    first.localeCompare(second),
  )
  return {
    endpointCount: Object.keys(endpointLabels).length,
    endpointLabels,
    componentByEndpointKey,
    endpointComponents,
  }
}
