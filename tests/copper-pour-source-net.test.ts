import { expect, test } from "bun:test"
import type { PcbCopperPour } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

const makePour = (id: string, sourceNetId?: string): PcbCopperPour => ({
  type: "pcb_copper_pour",
  pcb_copper_pour_id: id,
  source_net_id: sourceNetId,
  shape: "rect",
  center: { x: 0, y: 0 },
  width: 10,
  height: 10,
  layer: "top",
  covered_with_solder_mask: true,
})

test("a copper pour joins the ports and vias on its declared source net", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    makePour("ground_pour", "ground"),
    {
      type: "source_trace",
      source_trace_id: "ground_trace",
      connected_source_net_ids: ["ground"],
      connected_source_port_ids: ["ground_port"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "ground_via",
      source_net_id: "ground",
      x: 0,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
  ])

  expect(map.areIdsConnected("ground_pour", "ground")).toBe(true)
  expect(map.areIdsConnected("ground_pour", "ground_port")).toBe(true)
  expect(map.areIdsConnected("ground_pour", "ground_via")).toBe(true)
})

test("copper pours preserve distinct net assignments without source traces", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    makePour("ground_pour", "ground"),
    makePour("power_pour", "power"),
  ])

  expect(map.areIdsConnected("ground_pour", "ground")).toBe(true)
  expect(map.areIdsConnected("power_pour", "power")).toBe(true)
  expect(map.areIdsConnected("ground_pour", "power_pour")).toBe(false)
})

test("a copper pour without a source net does not invent logical connectivity", () => {
  const map = getFullConnectivityMapFromCircuitJson([
    makePour("unassigned_pour"),
  ])

  expect(map.getNetConnectedToId("unassigned_pour")).toBeUndefined()
  expect(map.netMap).toEqual({})
})
