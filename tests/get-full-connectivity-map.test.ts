import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnySoupElement } from "@tscircuit/soup"

test("should create full connectivity map from circuit JSON", () => {
  const circuitJson: AnySoupElement[] = [
    {
      type: "source_trace",
      source_trace_id: "trace1",
      connected_source_port_ids: ["port1", "port2"],
      connected_source_net_ids: ["net1"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port1",
      source_port_id: "port1",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "smtpad1",
      pcb_port_id: "pcb_port1",
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole1",
      pcb_port_id: "pcb_port2",
    },
    {
      type: "source_trace",
      source_trace_id: "trace2",
      connected_source_port_ids: ["port3"],
      connected_source_net_ids: ["net2"],
    },
  ]

  const result = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(result.areIdsConnected("smtpad1", "port1")).toBe(true)
})
