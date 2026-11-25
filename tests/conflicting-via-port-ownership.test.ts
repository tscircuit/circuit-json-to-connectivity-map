import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

test("via port references cannot overwrite the ports' intended source ownership", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_manually_placed_via",
      source_manually_placed_via_id: "vm_via_source",
      source_group_id: "board",
      source_trace_id: "vm_trace",
    },
    {
      type: "source_manually_placed_via",
      source_manually_placed_via_id: "gnd_via_source",
      source_group_id: "board",
      source_trace_id: "gnd_trace",
    },
    {
      type: "source_port",
      source_port_id: "vm_port",
      source_component_id: "vm_via_source",
      name: "top",
    },
    {
      type: "source_port",
      source_port_id: "gnd_port",
      source_component_id: "gnd_via_source",
      name: "bottom",
    },
    {
      type: "pcb_via",
      pcb_via_id: "via",
      pcb_port_ids: ["pcb_vm", "pcb_gnd"],
      x: 0,
      y: 0,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_vm",
      source_port_id: "vm_port",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_gnd",
      source_port_id: "gnd_port",
      x: 0,
      y: 0,
      layers: ["bottom"],
    },
    {
      type: "source_trace",
      source_trace_id: "vm_trace",
      connected_source_port_ids: ["vm_port"],
      connected_source_net_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "gnd_trace",
      connected_source_port_ids: ["gnd_port"],
      connected_source_net_ids: [],
    },
  ]

  for (const orderedCircuit of [circuitJson, circuitJson.toReversed()]) {
    const connMap = getFullConnectivityMapFromCircuitJson(orderedCircuit)
    expect(connMap.areIdsConnected("pcb_vm", "vm_trace")).toBe(true)
    expect(connMap.areIdsConnected("pcb_gnd", "gnd_trace")).toBe(true)
    expect(connMap.areIdsConnected("vm_trace", "gnd_trace")).toBe(false)
    expect(connMap.areIdsConnected("via", "vm_trace")).toBe(false)
    expect(connMap.areIdsConnected("via", "gnd_trace")).toBe(false)
  }
})
