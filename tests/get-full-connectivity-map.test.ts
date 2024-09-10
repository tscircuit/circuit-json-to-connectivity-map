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
      x: 0,
      y: 0,
      pcb_component_id: "component1",
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "smtpad1",
      pcb_port_id: "pcb_port1",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      layer: "top",
      shape: "rect",
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole1",
      pcb_port_id: "pcb_port2",
      x: 0,
      y: 0,
      layers: ["top"],
      shape: "circle",
      hole_diameter: 8,
      outer_diameter: 10,
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
