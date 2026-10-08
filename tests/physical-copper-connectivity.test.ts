import { expect, test } from "bun:test"
import {
  capturePhysicalConnectivity,
  type PhysicalConnectivityInput,
  type PhysicalConnectivityTrace,
  type PhysicalConnectivityWire,
} from "../src"

const wire = (
  x: number,
  y: number,
  width = 0.1,
  layer = "top",
): PhysicalConnectivityWire => ({ route_type: "wire", x, y, width, layer })

const trace = (
  id: string,
  route: PhysicalConnectivityTrace["route"],
  netName = "NET",
): PhysicalConnectivityTrace => ({ pcb_trace_id: id, netName, route })

const problem = (
  points: Array<[number, number, string?]>,
): PhysicalConnectivityInput => ({
  layerCount: 1,
  defaultViaDiameter: 0.6,
  endpoints: points.map(([x, y, layer = "top"], index) => ({
    endpointKey: `terminal-${index}`,
    point: { x, y },
    layers: [layer],
    netName: "NET",
  })),
  obstacles: [],
  traces: [],
})

test("detects partition swaps even when the number of connected terminals stays equal", () => {
  const input = problem([
    [-2, 1],
    [-2, -1],
    [2, 1],
    [2, -1],
  ])
  input.traces = [
    trace("left", [wire(-2, 1), wire(-2, -1)]),
    trace("right", [wire(2, 1), wire(2, -1)]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
    ["terminal-2", "terminal-3"],
  ])
  input.traces = [
    trace("top", [wire(-2, 1), wire(2, 1)]),
    trace("bottom", [wire(-2, -1), wire(2, -1)]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-2"],
    ["terminal-1", "terminal-3"],
  ])
})

test("the first wire point owns segment width, including contact at a copper edge", () => {
  const input = problem([
    [0, 0],
    [2, 0],
    [1, 0.4],
  ])
  input.traces = [trace("wide-first", [wire(0, 0, 1), wire(2, 0, 0.2)])]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1", "terminal-2"],
  ])
  input.traces = [trace("narrow-first", [wire(0, 0, 0.2), wire(2, 0, 1)])]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
    ["terminal-2"],
  ])
})

test("touching same-net pads can bridge terminals without traces", () => {
  const input = problem([
    [-0.5, 0],
    [0.5, 0],
  ])
  input.obstacles = [-0.5, 0.5].map((x) => ({
    type: "rect",
    center: { x, y: 0 },
    width: 1,
    height: 1,
    layers: ["top"],
    netNames: ["NET"],
  }))
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
  ])
  input.obstacles[1].netNames = ["UNRELATED"]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0"],
    ["terminal-1"],
  ])
})

test("circular pads do not connect traces passing only through rectangular bounds", () => {
  const input = problem([
    [-1, 3],
    [3, -1],
    [0, 0],
  ])
  input.obstacles = [
    {
      type: "oval",
      obstacleId: "circle",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      layers: ["top"],
      netNames: ["NET"],
    },
  ]
  input.traces = [
    trace("bent", [wire(-1, 3, 0.8), wire(0.6, 0.6, 0.8), wire(3, -1, 0.8)]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1", "terminal-2"],
  ])
  input.traces = [trace("shortcut", [wire(-1, 3, 0.8), wire(3, -1, 0.8)])]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
    ["terminal-2"],
  ])
})

test("rotated rectangular pads use their copper outline", () => {
  const input = problem([
    [0.6, 0.6],
    [-0.6, -0.6],
    [0.6, -0.6],
  ])
  input.obstacles = [
    {
      type: "rect",
      center: { x: 0, y: 0 },
      width: 2,
      height: 0.2,
      ccwRotationDegrees: 45,
      layers: ["top"],
      netNames: ["NET"],
    },
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
    ["terminal-2"],
  ])
})

test("vias connect their full layer span but crossing traces on separate layers do not", () => {
  const input = problem([
    [-1, 0],
    [1, 0, "bottom"],
    [0.45, 0, "inner1"],
  ])
  input.layerCount = 4
  input.defaultViaDiameter = 1
  input.traces = [
    trace("via-route", [
      wire(-1, 0, 0.2),
      wire(0, 0, 0.2),
      { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
      wire(0, 0, 0.2, "bottom"),
      wire(1, 0, 0.2, "bottom"),
    ]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1", "terminal-2"],
  ])
  input.traces = [
    trace("top", [wire(-1, 0), wire(1, 0)]),
    trace("bottom", [wire(0, -1, 0.1, "bottom"), wire(0, 1, 0.1, "bottom")]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0"],
    ["terminal-1"],
    ["terminal-2"],
  ])
})

test.each([1.65, 1.8])(
  "a 0603 jumper at spacing %s bridges pads without connecting copper under its body",
  (spacing) => {
    const half = spacing / 2
    const input = problem([
      [-half, 0],
      [half, 0],
      [0, -1],
      [0, 1],
    ])
    input.traces = [
      trace("jumper", [
        wire(-half, 0),
        wire(half, 0),
        {
          route_type: "jumper",
          start: { x: -half, y: 0 },
          end: { x: half, y: 0 },
          footprint: "0603",
          layer: "top",
        },
      ]),
      trace("under-body", [wire(0, -1), wire(0, 1)]),
    ]
    expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
      ["terminal-0", "terminal-1"],
      ["terminal-2", "terminal-3"],
    ])
  },
)

test("through-obstacle markers require a physical same-net multilayer witness", () => {
  const input = problem([
    [-0.5, 0],
    [0.5, 0, "bottom"],
  ])
  input.layerCount = 2
  input.obstacles = [
    {
      type: "rect",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      layers: ["top", "bottom"],
      netNames: ["NET"],
    },
  ]
  input.traces = [
    trace("plated-route", [
      {
        route_type: "through_obstacle",
        start: { x: -0.5, y: 0 },
        end: { x: 0.5, y: 0 },
        from_layer: "top",
        to_layer: "bottom",
        width: 0.2,
      },
    ]),
  ]
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["terminal-0", "terminal-1"],
  ])
  input.obstacles[0].netNames = ["UNRELATED"]
  expect(() => capturePhysicalConnectivity(input)).toThrow(
    "no same-net multilayer obstacle witness",
  )
})

test("non-colocated wire-via adjacency is rejected instead of inventing a connection", () => {
  const input = problem([
    [-1, 0],
    [1, 0, "bottom"],
  ])
  input.layerCount = 2
  input.traces = [
    trace("ambiguous-via", [
      wire(-1, 0),
      { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
      wire(1, 0, 0.1, "bottom"),
    ]),
  ]
  expect(() => capturePhysicalConnectivity(input)).toThrow(
    "adjacent to a non-colocated wire endpoint",
  )
})

test("unsupported ellipses throw so callers can explicitly reject changes", () => {
  const input = problem([
    [-1, 0],
    [1, 0],
  ])
  input.obstacles = [
    {
      type: "oval",
      obstacleId: "ellipse",
      center: { x: 0, y: 0 },
      width: 2,
      height: 1,
      layers: ["top"],
      netNames: ["NET"],
    },
  ]
  expect(() => capturePhysicalConnectivity(input)).toThrow(
    "does not yet support non-circular oval obstacle ellipse",
  )
})

test("identifiers are opaque, snapshots are independent, and inputs remain unchanged", () => {
  const input = problem([
    [0, 0],
    [1, 0],
  ])
  input.endpoints[0].endpointKey = "__proto__"
  input.endpoints[1].endpointKey = "constructor"
  for (const endpoint of input.endpoints) endpoint.netName = "opaque|net:α"
  input.traces = [
    trace("GND_POWER_extra", [wire(0, 0), wire(1, 0)], "opaque|net:α"),
  ]
  const before = structuredClone(input)
  const snapshot = capturePhysicalConnectivity(input)
  expect(snapshot.endpointComponents).toEqual([["__proto__", "constructor"]])
  expect(Object.entries(snapshot.componentByEndpointKey)).toContainEqual([
    "constructor",
    "__proto__",
  ])
  expect(input).toEqual(before)
  input.traces[0].route = []
  expect(snapshot.endpointComponents).toEqual([["__proto__", "constructor"]])
  expect(capturePhysicalConnectivity(input).endpointComponents).toEqual([
    ["__proto__"],
    ["constructor"],
  ])
})

test("duplicate terminal keys are rejected", () => {
  const input = problem([
    [0, 0],
    [1, 0],
  ])
  input.endpoints[1].endpointKey = input.endpoints[0].endpointKey
  expect(() => capturePhysicalConnectivity(input)).toThrow(
    "Duplicate physical endpoint key",
  )
})
