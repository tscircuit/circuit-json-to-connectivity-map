import { test, expect } from "bun:test"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import type { AnyCircuitElement } from "@tscircuit/soup"

test("PcbConnectivityMap should correctly identify connected traces and ports", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace1",
      route: [
        {
          x: 0,
          y: 0,
          route_type: "wire",
          width: 1,
          layer: "top",
          start_pcb_port_id: "port1",
        },
        { x: 10, y: 0, route_type: "wire", width: 1, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "trace2",
      route: [
        { x: 5, y: 0, route_type: "wire", width: 1, layer: "top" },
        { x: 15, y: 0, route_type: "wire", width: 1, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "trace3",
      route: [
        { x: 20, y: 0, route_type: "wire", width: 1, layer: "top" },
        {
          x: 30,
          y: 0,
          route_type: "wire",
          width: 1,
          layer: "top",
          end_pcb_port_id: "port2",
        },
      ],
    },
    {
      type: "pcb_port",
      pcb_port_id: "port1",
      x: 0,
      y: 0,
      source_port_id: "source_port1",
      pcb_component_id: "component1",
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "port2",
      x: 30,
      y: 0,
      source_port_id: "source_port2",
      pcb_component_id: "component2",
      layers: ["top"],
    },
  ]

  const pcbConnectivityMap = new PcbConnectivityMap(circuitJson)

  // Test trace connections
  expect(pcbConnectivityMap.areTracesConnected("trace1", "trace2")).toBe(true)
  expect(pcbConnectivityMap.areTracesConnected("trace1", "trace3")).toBe(false)
  expect(pcbConnectivityMap.areTracesConnected("trace2", "trace3")).toBe(false)

  const connectedTraces =
    pcbConnectivityMap.getAllTracesConnectedToTrace("trace1")
  expect(connectedTraces.map((trace) => trace.pcb_trace_id)).toContain("trace2")
  expect(connectedTraces.map((trace) => trace.pcb_trace_id)).not.toContain(
    "trace3",
  )

  // Test port connections
  const tracesConnectedToPort1 =
    pcbConnectivityMap.getAllTracesConnectedToPort("port1")
  expect(tracesConnectedToPort1.map((trace) => trace.pcb_trace_id)).toContain(
    "trace1",
  )
  expect(tracesConnectedToPort1.map((trace) => trace.pcb_trace_id)).toContain(
    "trace2",
  )
  expect(
    tracesConnectedToPort1.map((trace) => trace.pcb_trace_id),
  ).not.toContain("trace3")

  const tracesConnectedToPort2 =
    pcbConnectivityMap.getAllTracesConnectedToPort("port2")
  expect(tracesConnectedToPort2.map((trace) => trace.pcb_trace_id)).toContain(
    "trace3",
  )
  expect(
    tracesConnectedToPort2.map((trace) => trace.pcb_trace_id),
  ).not.toContain("trace1")
  expect(
    tracesConnectedToPort2.map((trace) => trace.pcb_trace_id),
  ).not.toContain("trace2")
})
