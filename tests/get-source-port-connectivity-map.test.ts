import { test, expect } from "bun:test"
import { getSourcePortConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

test("should create source port connectivity map from circuit JSON", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "trace1",
      connected_source_port_ids: ["port1", "port2"],
      connected_source_net_ids: ["net1"],
    },
    {
      type: "source_trace",
      source_trace_id: "trace2",
      connected_source_port_ids: ["port3"],
      connected_source_net_ids: ["net1", "net2"],
    },
    {
      type: "source_trace",
      source_trace_id: "trace3",
      connected_source_port_ids: ["port4"],
      connected_source_net_ids: ["net3"],
    },
  ]

  const cmap = getSourcePortConnectivityMapFromCircuitJson(circuitJson)

  expect(cmap.areIdsConnected("port3", "port1")).toBeTrue()
})

test("should handle internally_connected_source_port_ids in source_component for source port connectivity map", () => {
  const circuitJson: any[] = [
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "C1",
      internally_connected_source_port_ids: [
        ["p1", "p2"],
        ["p3", "p4"],
      ],
    },
    {
      type: "source_trace",
      source_trace_id: "trace1",
      connected_source_port_ids: ["p2", "p5"],
    },
    {
      type: "source_port",
      source_port_id: "p5",
      name: "P5",
      source_component_id: "sc1",
    },
  ]

  const result = getSourcePortConnectivityMapFromCircuitJson(circuitJson)

  expect(result.areIdsConnected("p1", "p2")).toBe(true)
  expect(result.areIdsConnected("p3", "p4")).toBe(true)
  expect(result.areIdsConnected("p1", "p3")).toBe(false)
  expect(result.areIdsConnected("p1", "p5")).toBe(true)
  expect(result.areIdsConnected("p2", "p5")).toBe(true)
})
