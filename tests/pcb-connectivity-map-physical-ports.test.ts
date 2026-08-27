import { expect, test } from "bun:test"
import type { AnyCircuitElement, LayerRef, PcbTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

const makePortAndPad = (
  id: string,
  x: number,
  layer: LayerRef = "top",
): AnyCircuitElement[] => [
  {
    type: "pcb_port",
    pcb_port_id: `port_${id}`,
    source_port_id: `source_port_${id}`,
    x,
    y: 0,
    layers: [layer],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: `pad_${id}`,
    pcb_port_id: `port_${id}`,
    shape: "rect",
    x,
    y: 0,
    width: 1,
    height: 1,
    layer,
  },
]

const makeTrace = (
  id: string,
  startX: number,
  endX: number,
  layer: LayerRef = "top",
): PcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: `trace_${id}`,
  route: [
    { route_type: "wire", x: startX, y: 0, width: 0.2, layer },
    { route_type: "wire", x: endX, y: 0, width: 0.2, layer },
  ],
})

test("finds every physical group on a multi-port net", () => {
  const splitCircuit: AnyCircuitElement[] = [
    ...makePortAndPad("0", -6),
    ...makePortAndPad("1", -3),
    ...makePortAndPad("2", 3),
    ...makePortAndPad("3", 6),
    makeTrace("left", -6, -3),
    makeTrace("right", 3, 6),
  ]

  const splitMap = new PcbConnectivityMap(splitCircuit)
  expect(splitMap.arePortsConnected("port_0", "port_1")).toBe(true)
  expect(splitMap.arePortsConnected("port_2", "port_3")).toBe(true)
  expect(splitMap.arePortsConnected("port_1", "port_2")).toBe(false)

  const bridgedMap = new PcbConnectivityMap([
    ...splitCircuit,
    makeTrace("bridge", -3, 3),
  ])
  expect(bridgedMap.arePortsConnected("port_0", "port_3")).toBe(true)

  const pouredMap = new PcbConnectivityMap([
    ...splitCircuit,
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pour_0",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 14,
      height: 2,
      layer: "top",
      covered_with_solder_mask: true,
    },
  ])
  expect(pouredMap.arePortsConnected("port_0", "port_3")).toBe(true)
})

test("uses geometry instead of stale endpoint ids", () => {
  const staleTrace: PcbTrace = {
    ...makeTrace("stale", 10, 11),
    route: [
      {
        route_type: "wire",
        x: 10,
        y: 0,
        width: 0.2,
        layer: "top",
        start_pcb_port_id: "port_0",
      },
      { route_type: "wire", x: 11, y: 0, width: 0.2, layer: "top" },
    ],
  }
  const connectivityMap = new PcbConnectivityMap([
    ...makePortAndPad("0", 0),
    ...makePortAndPad("1", 11),
    staleTrace,
  ])

  expect(connectivityMap.arePortsConnected("port_0", "port_1")).toBe(false)
  expect(connectivityMap.getAllTracesConnectedToPort("port_0")).toEqual([])
})

test("connects traces that terminate inside rotated pill pads", () => {
  const connectivityMap = new PcbConnectivityMap([
    {
      type: "pcb_port",
      pcb_port_id: "port_pill",
      source_port_id: "source_port_pill",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_pill",
      pcb_port_id: "port_pill",
      shape: "rotated_pill",
      x: 0,
      y: 0,
      width: 2,
      height: 4,
      radius: 1,
      ccw_rotation: 90,
      layer: "top",
    },
    ...makePortAndPad("load", 3),
    makeTrace("pill_to_load", 1.5, 3),
  ])

  expect(connectivityMap.arePortsConnected("port_pill", "port_load")).toBe(true)
})

test("connects padless ports and traces through a standalone via", () => {
  const connectivityMap = new PcbConnectivityMap([
    ...makePortAndPad("top", -2, "top"),
    ...makePortAndPad("bottom", 2, "bottom"),
    {
      type: "pcb_port",
      pcb_port_id: "port_via",
      source_port_id: "source_port_via",
      x: 0,
      y: 0,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via_0",
      x: 0,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
    makeTrace("top", -2, 0, "top"),
    makeTrace("bottom", 0, 2, "bottom"),
  ])

  expect(connectivityMap.arePortsConnected("port_top", "port_via")).toBe(true)
  expect(connectivityMap.arePortsConnected("port_top", "port_bottom")).toBe(
    true,
  )
})
