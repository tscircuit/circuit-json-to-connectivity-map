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
