import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

test("only a jumper's declared internal connection can own its footprint copper", () => {
  const bridge: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "bridge",
    pcb_component_id: "JP1_pcb",
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 1,
        layer: "top",
        width: 0.2,
        start_pcb_port_id: "pad1",
      },
      {
        route_type: "wire",
        x: 0,
        y: 0,
        layer: "top",
        width: 0.2,
        end_pcb_port_id: "pad2",
      },
    ],
  }
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_port",
      source_port_id: "pin1",
      source_component_id: "JP1",
      name: "1",
    },
    {
      type: "source_port",
      source_port_id: "pin2",
      source_component_id: "JP1",
      name: "2",
    },
    {
      type: "source_port",
      source_port_id: "pin3",
      source_component_id: "JP1",
      name: "3",
    },
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "JP1_bridge",
      source_component_id: "JP1",
      source_port_ids: ["pin1", "pin2"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "JP1_pcb",
      source_component_id: "JP1",
      center: { x: 0, y: 0 },
      width: 1,
      height: 3,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_port",
      pcb_port_id: "pad1",
      source_port_id: "pin1",
      x: 0,
      y: 1,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pad2",
      source_port_id: "pin2",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pad3",
      source_port_id: "pin3",
      x: 0,
      y: -1,
      layers: ["top"],
    },
    bridge,
    {
      ...bridge,
      pcb_trace_id: "wrong_bridge",
      route: [
        bridge.route[0],
        {
          route_type: "wire",
          x: 0,
          y: -1,
          layer: "top",
          width: 0.2,
          end_pcb_port_id: "pad3",
        },
      ],
    },
    {
      ...bridge,
      pcb_trace_id: "other_component_bridge",
      pcb_component_id: "other_component",
    },
    {
      ...bridge,
      pcb_trace_id: "repeated_port_bridge",
      route: [bridge.route[0], bridge.route[0]],
    },
  ]

  for (const orderedCircuit of [circuitJson, circuitJson.toReversed()]) {
    const connMap = getFullConnectivityMapFromCircuitJson(orderedCircuit)
    expect(
      connMap.areAllIdsConnected(["JP1_bridge", "bridge", "pin1", "pin2"]),
    ).toBe(true)
    expect(connMap.areIdsConnected("bridge", "pin3")).toBe(false)
    expect(connMap.getNetConnectedToId("wrong_bridge")).toBeUndefined()
    expect(connMap.getNetConnectedToId("repeated_port_bridge")).toBeUndefined()
    expect(
      connMap.getNetConnectedToId("other_component_bridge"),
    ).toBeUndefined()
  }
})
