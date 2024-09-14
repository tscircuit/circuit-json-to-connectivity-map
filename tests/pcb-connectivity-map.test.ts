import { test, expect } from "bun:test"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import type { AnyCircuitElement } from "@tscircuit/soup"

test("PcbConnectivityMap should correctly identify connected traces", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace1",
      route: [
        { x: 0, y: 0, route_type: "wire", width: 1, layer: "top" },
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
        { x: 30, y: 0, route_type: "wire", width: 1, layer: "top" },
      ],
    },
  ]

  const pcbConnectivityMap = new PcbConnectivityMap(circuitJson)

  expect(pcbConnectivityMap.areTracesConnected("trace1", "trace2")).toBe(true)
  expect(pcbConnectivityMap.areTracesConnected("trace1", "trace3")).toBe(false)
  expect(pcbConnectivityMap.areTracesConnected("trace2", "trace3")).toBe(false)

  const connectedTraces =
    pcbConnectivityMap.getAllTracesConnectedToTrace("trace1")
  expect(connectedTraces).toContain("trace2")
  expect(connectedTraces).not.toContain("trace3")
})
