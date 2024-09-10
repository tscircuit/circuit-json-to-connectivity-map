import { test, expect } from "bun:test"
import { getSourcePortConnectivityMapFromCircuitJson } from "../src"
import type { AnySoupElement } from "@tscircuit/soup"

test("should create source port connectivity map from circuit JSON", () => {
  const circuitJson: AnySoupElement[] = [
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

  const result = getSourcePortConnectivityMapFromCircuitJson(circuitJson)

  expect(result).toEqual(
    new Map([
      // 3 & 5 here are from the merge operations, they're somewhat random
      // and not important- likewise with the ordering of the ports
      ["connectivity_net3", ["port3", "port1", "port2", "net1", "net2"]],
      ["connectivity_net5", ["port4", "net3"]],
    ]),
  )
})
