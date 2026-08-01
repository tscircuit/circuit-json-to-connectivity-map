import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

test("should create full connectivity map from circuit JSON", () => {
  const circuitJson: AnyCircuitElement[] = [
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

test("should handle internally_connected_source_port_ids in source_component for full connectivity map", () => {
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
      type: "pcb_port",
      pcb_port_id: "pcb_p5",
      source_port_id: "p5",
      x: 0,
      y: 0,
      pcb_component_id: "component1",
      layers: ["top"],
    },
  ]

  const result = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(result.areIdsConnected("p1", "p2")).toBe(true)
  expect(result.areIdsConnected("p3", "p4")).toBe(true)
  expect(result.areIdsConnected("p1", "p3")).toBe(false)
  expect(result.areIdsConnected("p1", "p5")).toBe(true)
  expect(result.areIdsConnected("p2", "p5")).toBe(true)
  expect(result.areIdsConnected("p1", "pcb_p5")).toBe(true)
})

test("should connect a pcb via through its source trace", () => {
  const circuitJson = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_1",
      source_trace_id: "source_trace_1",
      x: 0,
      y: 0,
      layers: ["top", "bottom"],
    },
  ] as AnyCircuitElement[]

  const result = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(result.areIdsConnected("pcb_via_1", "source_trace_1")).toBe(true)
  expect(result.areIdsConnected("pcb_via_1", "source_port_1")).toBe(true)
})
