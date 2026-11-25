import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

test("an unowned PCB trace cannot choose between two intended nets", () => {
  const circuitJson: AnyCircuitElement[] = [
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
      x: 1,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "bridge",
      route: [
        {
          route_type: "wire",
          x: 0,
          y: 0,
          width: 0.2,
          layer: "top",
          start_pcb_port_id: "pcb_vm",
        },
        {
          route_type: "wire",
          x: 1,
          y: 0,
          width: 0.2,
          layer: "top",
          end_pcb_port_id: "pcb_gnd",
        },
      ],
    },
  ]

  for (const orderedCircuit of [circuitJson, circuitJson.toReversed()]) {
    const connMap = getFullConnectivityMapFromCircuitJson(orderedCircuit)
    expect(connMap.areIdsConnected("vm_port", "gnd_port")).toBe(false)
    expect(connMap.areIdsConnected("bridge", "vm_port")).toBe(false)
    expect(connMap.areIdsConnected("bridge", "gnd_port")).toBe(false)
  }
})
