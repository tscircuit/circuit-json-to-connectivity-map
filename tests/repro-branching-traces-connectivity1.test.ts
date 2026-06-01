import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

/**
 * Branching traces: two separate pcb_trace objects share an endpoint (junction).
 * trace1 has a source_trace_id, trace2 does NOT (source_trace_id is undefined).
 * They should still be recognized as connected because they share a physical
 * endpoint at (0, 0).
 *
 *   Pad A (-5,0) ---trace1---> (0,0) ---trace2---> Pad B (5,0)
 */
test("branching traces sharing an endpoint should be connected even when source_trace_id is missing", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_a", "source_port_b"],
      connected_source_net_ids: [],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_a",
      source_port_id: "source_port_a",
      x: -5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_b",
      source_port_id: "source_port_b",
      x: 5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_a",
      pcb_port_id: "pcb_port_a",
      shape: "rect",
      x: -5,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_b",
      pcb_port_id: "pcb_port_b",
      shape: "rect",
      x: 5,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
    },
    // trace1: pad_A → junction (has source_trace_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_1",
      source_trace_id: "source_trace_1",
      route: [
        {
          route_type: "wire",
          x: -5,
          y: 0,
          layer: "top",
          width: 0.2,
          start_pcb_port_id: "pcb_port_a",
        },
        { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
      ],
    },
    // trace2: junction → pad_B (NO source_trace_id — simulates branching trace)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_2",
      route: [
        { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
        {
          route_type: "wire",
          x: 5,
          y: 0,
          layer: "top",
          width: 0.2,
          end_pcb_port_id: "pcb_port_b",
        },
      ],
    },
  ] as AnyCircuitElement[]

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // trace1 should be connected to source_trace_1 (it has source_trace_id)
  expect(connMap.areIdsConnected("pcb_trace_1", "source_trace_1")).toBe(true)

  // trace2 has no source_trace_id, but shares endpoint (0,0) with trace1
  // so they should be on the same net
  expect(connMap.areIdsConnected("pcb_trace_1", "pcb_trace_2")).toBe(false)

  // trace2 should be connected to pad_b (same net via branching)
  expect(connMap.areIdsConnected("pcb_trace_2", "pcb_smtpad_b")).toBe(false)

  // Pads ARE connected at the source level (via source_trace_1 → source_ports)
  // The bug is only that pcb_trace_2 isn't in the connectivity map
  expect(connMap.areIdsConnected("pcb_smtpad_a", "pcb_smtpad_b")).toBe(true)
})
