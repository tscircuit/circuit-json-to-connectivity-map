import { expect, test } from "bun:test"
import "bun-match-svg"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import fixture from "./fixtures/three-pad-jumper-copper-ownership/circuit.json"

test("a closed 3-pad jumper's transitive bridges both share its pads' declared SIG connection", async () => {
  const circuitJson = fixture as AnyCircuitElement[]
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(
    connMap.areAllIdsConnected([
      "source_net_0",
      "pcb_smtpad_0",
      "pcb_smtpad_1",
      "pcb_smtpad_2",
    ]),
  ).toBe(true)

  const leftBridgeHasOwner = connMap.areIdsConnected(
    "pcb_trace_0",
    "source_net_0",
  )
  const rightBridgeHasOwner = connMap.areIdsConnected(
    "pcb_trace_1",
    "source_net_0",
  )

  const statusNote: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "bridge_owner_status",
    anchor_position: { x: 0, y: -2.15 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.36,
    color: rightBridgeHasOwner ? "#2563eb" : "#dc2626",
    text: rightBridgeHasOwner
      ? "FIX: both JP1 bridges belong to SIG"
      : "BUG: JP1 pin2-pin3 bridge copper is UNASSIGNED",
  }

  expect(leftBridgeHasOwner).toBe(true)
  expect(rightBridgeHasOwner).toBe(true)

  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, statusNote], {
      width: 1000,
      height: 700,
      backgroundColor: "#fff",
      colorOverrides: {
        copper: { top: "#2563eb" },
        silkscreen: { top: "#64748b" },
        boardOutline: "#cbd5e1",
      },
      includeVersion: false,
      showPinNumbers: true,
      shouldDrawRatsNest: false,
      viewport: { minX: -6.5, maxX: 6.5, minY: -4.2, maxY: 4.2 },
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
