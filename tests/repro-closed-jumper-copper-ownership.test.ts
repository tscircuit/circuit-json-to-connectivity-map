import { expect, test } from "bun:test"
import "bun-match-svg"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import fixture from "./fixtures/closed-jumper-copper-ownership/circuit.json"

test("a closed jumper's pads share SIG but its bridge is left unassigned", async () => {
  const circuitJson = fixture as AnyCircuitElement[]
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(
    connMap.areAllIdsConnected([
      "source_net_0",
      "pcb_smtpad_0",
      "pcb_smtpad_1",
    ]),
  ).toBe(true)
  const bridgeHasOwner = connMap.areIdsConnected("pcb_trace_0", "source_net_0")
  expect(bridgeHasOwner).toBe(false)

  const bridgeNote: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "bridge_owner",
    anchor_position: { x: 0, y: -2.15 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.4,
    color: "#dc2626",
    text: "BUG: bridge copper is UNASSIGNED",
  }
  if (bridgeHasOwner) {
    bridgeNote.color = "#2563eb"
    bridgeNote.text = "FIX: bridge copper belongs to SIG"
  }

  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, bridgeNote], {
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
      viewport: { minX: -5.5, maxX: 5.5, minY: -3.85, maxY: 3.85 },
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
