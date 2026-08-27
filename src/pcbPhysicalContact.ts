import {
  getPcbElementBounds,
  type PcbBounds,
} from "@tscircuit/circuit-json-util"
import { computeGapBetweenCopper } from "@tscircuit/circuit-json-util/compute-gap-between-copper"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type {
  LayerRef,
  PcbCopperPour,
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  PcbTrace,
  PcbTraceRoutePointWire,
  PcbVia,
} from "circuit-json"

export type PcbPad = PcbSmtPad | PcbPlatedHole
export type SupportedCopperPour = Extract<
  PcbCopperPour,
  { shape: "rect" | "polygon" }
>
export type PhysicalCopperTarget = PcbPad | PcbVia | SupportedCopperPour

type WireSegment = {
  start: PcbTraceRoutePointWire
  end: PcbTraceRoutePointWire
  trace: PcbTrace
}

const physicalContactToleranceMm = 1e-9
const wireSegmentsByTrace = new WeakMap<PcbTrace, WireSegment[]>()
const boundsByCopper = new WeakMap<object, PcbBounds | null>()

const getCachedBounds = (copper: PhysicalCopperTarget | PcbTrace) => {
  if (!boundsByCopper.has(copper)) {
    boundsByCopper.set(copper, getPcbElementBounds(copper))
  }
  return boundsByCopper.get(copper) ?? null
}

const boundsCanTouch = (
  first: PhysicalCopperTarget | PcbTrace,
  second: PhysicalCopperTarget | PcbTrace,
): boolean => {
  const firstBounds = getCachedBounds(first)
  const secondBounds = getCachedBounds(second)
  if (!firstBounds || !secondBounds) return true
  return (
    firstBounds.minX <= secondBounds.maxX + physicalContactToleranceMm &&
    firstBounds.maxX + physicalContactToleranceMm >= secondBounds.minX &&
    firstBounds.minY <= secondBounds.maxY + physicalContactToleranceMm &&
    firstBounds.maxY + physicalContactToleranceMm >= secondBounds.minY
  )
}

const getLayers = (target: PhysicalCopperTarget): LayerRef[] => {
  if (target.type === "pcb_smtpad") return [target.layer]
  if (target.type === "pcb_copper_pour") return [target.layer]
  return target.layers
}

const getWireSegments = (trace: PcbTrace): WireSegment[] => {
  const cachedSegments = wireSegmentsByTrace.get(trace)
  if (cachedSegments) return cachedSegments
  const segments: WireSegment[] = []
  for (let index = 0; index < trace.route.length - 1; index++) {
    const start = trace.route[index]
    const end = trace.route[index + 1]
    if (start?.route_type !== "wire" || end?.route_type !== "wire") continue
    if (start.layer !== end.layer) continue
    segments.push({
      start,
      end,
      trace: {
        type: "pcb_trace",
        pcb_trace_id: `${trace.pcb_trace_id}:segment:${index}`,
        route: [start, end],
      },
    })
  }
  wireSegmentsByTrace.set(trace, segments)
  return segments
}

export const doesTraceTouchCopperTarget = ({
  trace,
  target,
}: {
  trace: PcbTrace
  target: PhysicalCopperTarget
}): boolean => {
  const targetLayers = getLayers(target)
  return getWireSegments(trace).some(
    (segment) =>
      targetLayers.includes(segment.start.layer) &&
      boundsCanTouch(segment.trace, target) &&
      computeGapBetweenCopper(segment.trace, target) <=
        physicalContactToleranceMm,
  )
}

export const doesPortTouchTrace = ({
  port,
  trace,
}: {
  port: PcbPort
  trace: PcbTrace
}): boolean =>
  getWireSegments(trace).some(
    (segment) =>
      port.layers.includes(segment.start.layer) &&
      pointToSegmentDistance(port, segment.start, segment.end) <=
        segment.start.width / 2 + physicalContactToleranceMm,
  )

export const doCopperTargetsTouch = (
  first: PhysicalCopperTarget,
  second: PhysicalCopperTarget,
): boolean =>
  getLayers(first).some((layer) => getLayers(second).includes(layer)) &&
  boundsCanTouch(first, second) &&
  computeGapBetweenCopper(first, second) <= physicalContactToleranceMm

export const doesPortTouchVia = (port: PcbPort, via: PcbVia): boolean =>
  port.layers.some((layer) => via.layers.includes(layer)) &&
  Math.hypot(port.x - via.x, port.y - via.y) <=
    via.outer_diameter / 2 + physicalContactToleranceMm
