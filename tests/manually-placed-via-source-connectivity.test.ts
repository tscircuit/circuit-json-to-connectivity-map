import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

test("a manually placed via's declared source net owns its layer ports", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_net",
      source_net_id: "gnd",
      name: "GND",
      member_source_group_ids: [],
    },
    {
      type: "source_manually_placed_via",
      source_manually_placed_via_id: "via_source",
      source_net_id: "gnd",
      source_group_id: "board",
    },
    {
      type: "source_port",
      source_port_id: "via_top",
      source_component_id: "via_source",
      name: "top",
    },
    {
      type: "source_port",
      source_port_id: "via_bottom",
      source_component_id: "via_source",
      name: "bottom",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_top",
      source_port_id: "via_top",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_bottom",
      source_port_id: "via_bottom",
      x: 0,
      y: 0,
      layers: ["bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via",
      source_manually_placed_via_id: "via_source",
      pcb_port_ids: ["pcb_top", "pcb_bottom"],
      x: 0,
      y: 0,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
  ]
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(
    connMap.areAllIdsConnected([
      "gnd",
      "via_source",
      "via_top",
      "via_bottom",
      "pcb_top",
      "pcb_bottom",
      "via",
    ]),
  ).toBe(true)
})
