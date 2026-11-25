import { expect, test } from "bun:test"
import "bun-match-svg"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  getFullConnectivityMapFromCircuitJson,
  getSourcePortConnectivityMapFromCircuitJson,
} from "../src"
import fixture from "./fixtures/nema8-tvs-sample/circuit.json"

test("the NEMA8 TVS sample merges VM and GND through a saved PCB endpoint", async () => {
  const circuitJson = fixture as AnyCircuitElement[]
  const sourceConnectivity =
    getSourcePortConnectivityMapFromCircuitJson(circuitJson)
  expect(
    sourceConnectivity.areIdsConnected("source_port_155", "source_port_150"),
  ).toBe(false)

  const fullConnectivity = getFullConnectivityMapFromCircuitJson(circuitJson)
  const vmConnectedToGnd = fullConnectivity.areIdsConnected(
    "source_port_155",
    "source_port_150",
  )
  expect(vmConnectedToGnd).toBe(true)
  expect(
    fullConnectivity.areIdsConnected("source_trace_8", "pcb_port_150"),
  ).toBe(true)

  const resultNote: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "map_result",
    anchor_position: { x: 0, y: -5.05 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.4,
    color: "#b91c1c",
    text: "BUG: VM and GND wrongly merged",
  }
  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, resultNote], {
      width: 1000,
      height: 700,
      backgroundColor: "#fff",
      colorOverrides: {
        silkscreen: { top: "#64748b" },
        boardOutline: "#cbd5e1",
      },
      includeVersion: false,
      showPinNumbers: true,
      shouldDrawRatsNest: false,
      viewport: { minX: -9.5, maxX: 9.5, minY: -6.5, maxY: 6.5 },
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
