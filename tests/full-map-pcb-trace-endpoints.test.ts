import { expect, test } from "bun:test"
import type { PcbTraceRoutePointWire, PCBTrace } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

const wire = (
  x: number,
  ids: Partial<
    Pick<PcbTraceRoutePointWire, "start_pcb_port_id" | "end_pcb_port_id">
  > = {},
): PcbTraceRoutePointWire => ({
  route_type: "wire",
  x,
  y: 0,
  width: 0.2,
  layer: "top",
  ...ids,
})

const trace = (route: PCBTrace["route"]): PCBTrace => ({
  type: "pcb_trace",
  pcb_trace_id: "pcb_trace_1",
  route,
})

test("a trace with only a start port keeps that connection", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    trace([wire(0, { start_pcb_port_id: "port_start" }), wire(1)]),
  ])
  expect(map.areIdsConnected("pcb_trace_1", "port_start")).toBe(true)
  expect(map.areIdsConnected("pcb_trace_1", "unknown_port")).toBe(false)
})

test("a trace with only an end port keeps that connection", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    trace([wire(0), wire(1, { end_pcb_port_id: "port_end" })]),
  ])
  expect(map.areIdsConnected("pcb_trace_1", "port_end")).toBe(true)
})

test("all endpoint references on a route join the trace network", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    trace([
      wire(0, { start_pcb_port_id: "port_a" }),
      wire(1, { end_pcb_port_id: "port_b" }),
      wire(2, { start_pcb_port_id: "port_c" }),
      wire(3, { end_pcb_port_id: "port_d" }),
    ]),
  ])
  expect(
    map.areAllIdsConnected([
      "pcb_trace_1",
      "port_a",
      "port_b",
      "port_c",
      "port_d",
    ]),
  ).toBe(true)
})

test("a single-ended PCB route still joins its source trace network", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
      connected_source_net_ids: [],
    },
    {
      ...trace([wire(0, { start_pcb_port_id: "pcb_port_1" }), wire(1)]),
      source_trace_id: "source_trace_1",
    },
  ])
  expect(
    map.areAllIdsConnected([
      "source_trace_1",
      "source_port_1",
      "pcb_trace_1",
      "pcb_port_1",
    ]),
  ).toBe(true)
})

test("repeated references and via transitions do not duplicate connected ids", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    trace([
      wire(0, { start_pcb_port_id: "port_a", end_pcb_port_id: "port_a" }),
      { route_type: "via", x: 1, y: 0, from_layer: "top", to_layer: "bottom" },
      { ...wire(1, { start_pcb_port_id: "port_b" }), layer: "bottom" },
      { ...wire(2, { end_pcb_port_id: "port_b" }), layer: "bottom" },
    ]),
  ])
  const net = map.getNetConnectedToId("pcb_trace_1")!
  expect(map.getIdsConnectedToNet(net).sort()).toEqual([
    "pcb_trace_1",
    "port_a",
    "port_b",
  ])
})
