import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src/getFullConnectivityMapFromCircuitJson"

test("connects one-ended T113 fanout traces to their PCB ports", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_63",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_63",
      layers: ["top"],
      x: 6.199886,
      y: -7.629906,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_64",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_63",
      layer: "top",
      shape: "rect",
      width: 0.4,
      height: 1.46,
      x: 6.199886,
      y: -7.629906,
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "breakout:pcb_breakout_point_33_0",
      source_trace_id: "breakout:pcb_breakout_point_33",
      route: [
        {
          route_type: "wire",
          x: 6.199886,
          y: -7.629906,
          width: 0.1,
          layer: "top",
          start_pcb_port_id: "pcb_port_63",
        },
        {
          route_type: "wire",
          x: 6.199886,
          y: -8.359902,
          width: 0.1,
          layer: "top",
        },
      ],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_79",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_79",
      layers: ["top"],
      x: 7.629906,
      y: -0.199898,
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "breakout:pcb_breakout_point_38_0",
      source_trace_id: "breakout:pcb_breakout_point_38",
      route: [
        {
          route_type: "wire",
          x: 7.734034,
          y: -0.304034,
          width: 0.1,
          layer: "top",
        },
        {
          route_type: "wire",
          x: 7.629906,
          y: -0.199898,
          width: 0.1,
          layer: "top",
          end_pcb_port_id: "pcb_port_79",
        },
      ],
    },
  ]

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(
    connMap.areIdsConnected(
      "breakout:pcb_breakout_point_33_0",
      "pcb_smtpad_64",
    ),
  ).toBe(true)
  expect(
    connMap.areIdsConnected("breakout:pcb_breakout_point_38_0", "pcb_port_79"),
  ).toBe(true)
})
