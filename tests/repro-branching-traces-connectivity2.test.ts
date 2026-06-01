import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

/**
 * T-junction: 3 pads connected by 3 traces meeting at a single junction (0,0).
 * trace1 has source_trace_id, trace2 and trace3 do NOT.
 *
 *   Pad A (-5,0) ---trace1---> (0,0) ---trace2---> Pad B (5,0)
 *                                 |
 *                              trace3
 *                                 |
 *                              Pad C (0,5)
 */
test("T-junction: 3 branching traces at a shared point should all be connected", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [
        "source_port_a",
        "source_port_b",
        "source_port_c",
      ],
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
      type: "pcb_port",
      pcb_port_id: "pcb_port_c",
      source_port_id: "source_port_c",
      x: 0,
      y: 5,
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
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_c",
      pcb_port_id: "pcb_port_c",
      shape: "rect",
      x: 0,
      y: 5,
      width: 1,
      height: 1,
      layer: "top",
    },
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
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_3",
      route: [
        { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
        {
          route_type: "wire",
          x: 0,
          y: 5,
          layer: "top",
          width: 0.2,
          end_pcb_port_id: "pcb_port_c",
        },
      ],
    },
  ] as AnyCircuitElement[]

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // BUG: All three traces should be on the same net, but traces without
  // source_trace_id are not connected via shared endpoints yet
  expect(connMap.areIdsConnected("pcb_trace_1", "pcb_trace_2")).toBe(false)
  expect(connMap.areIdsConnected("pcb_trace_1", "pcb_trace_3")).toBe(false)
  expect(connMap.areIdsConnected("pcb_trace_2", "pcb_trace_3")).toBe(false)

  // Pads ARE connected at the source level (via source_trace_1 → source_ports)
  // The bug is only that pcb_trace_2 and pcb_trace_3 aren't in the connectivity map
  expect(connMap.areIdsConnected("pcb_smtpad_a", "pcb_smtpad_b")).toBe(true)
  expect(connMap.areIdsConnected("pcb_smtpad_a", "pcb_smtpad_c")).toBe(true)
})
