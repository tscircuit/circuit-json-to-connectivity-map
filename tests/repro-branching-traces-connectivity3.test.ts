import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

/**
 * Multi-hop chain: 2 pads connected by 3 traces in series through 2 junctions.
 * Only the first trace has source_trace_id.
 *
 *   Pad A (-6,0) ---trace1---> (-2,0) ---trace2---> (2,0) ---trace3---> Pad B (6,0)
 */
test("multi-hop chain: traces connected in series through multiple junctions", () => {
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
      x: -6,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_b",
      source_port_id: "source_port_b",
      x: 6,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_a",
      pcb_port_id: "pcb_port_a",
      shape: "rect",
      x: -6,
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
      x: 6,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
    },
    // trace1: pad_A → junction1 (has source_trace_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_1",
      source_trace_id: "source_trace_1",
      route: [
        {
          route_type: "wire",
          x: -6,
          y: 0,
          layer: "top",
          width: 0.2,
          start_pcb_port_id: "pcb_port_a",
        },
        { route_type: "wire", x: -2, y: 0, layer: "top", width: 0.2 },
      ],
    },
    // trace2: junction1 → junction2 (NO source_trace_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_2",
      route: [
        { route_type: "wire", x: -2, y: 0, layer: "top", width: 0.2 },
        { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.2 },
      ],
    },
    // trace3: junction2 → pad_B (NO source_trace_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_3",
      route: [
        { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.2 },
        {
          route_type: "wire",
          x: 6,
          y: 0,
          layer: "top",
          width: 0.2,
          end_pcb_port_id: "pcb_port_b",
        },
      ],
    },
  ] as AnyCircuitElement[]

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // BUG: All three traces should be chained on the same net, but traces
  // without source_trace_id are not connected via shared endpoints yet
  expect(connMap.areIdsConnected("pcb_trace_1", "pcb_trace_2")).toBe(false)
  expect(connMap.areIdsConnected("pcb_trace_2", "pcb_trace_3")).toBe(false)
  expect(connMap.areIdsConnected("pcb_trace_1", "pcb_trace_3")).toBe(false)

  // Pads ARE connected at the source level (via source_trace_1 → source_ports)
  // The bug is only that pcb_trace_2 and pcb_trace_3 aren't in the connectivity map
  expect(connMap.areIdsConnected("pcb_smtpad_a", "pcb_smtpad_b")).toBe(true)
})
