import { expect, test } from "bun:test"
import "bun-match-svg"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import fixture from "./fixtures/nema8-tvs-sample/circuit.json"

test("an unowned NEMA8 trace does not inherit GND from its endpoint references", async () => {
  const circuitJson = structuredClone(fixture) as AnyCircuitElement[]
  const trace = circuitJson.find((element) => element.type === "pcb_trace")!
  const capacitorGround = circuitJson
    .filter((element) => element.type === "pcb_port")
    .find((pcbPort) => pcbPort.pcb_port_id === "pcb_port_156")!
  trace.source_trace_id = undefined
  trace.route[0] = {
    route_type: "wire",
    x: capacitorGround.x,
    y: capacitorGround.y,
    layer: "top",
    width: 0.56,
    start_pcb_port_id: capacitorGround.pcb_port_id,
  }

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(connMap.getNetConnectedToId(trace.pcb_trace_id)).toBeUndefined()
  expect(connMap.areIdsConnected("source_port_155", "source_port_150")).toBe(
    false,
  )

  const resultNote: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "unowned_trace_result",
    anchor_position: { x: 0, y: -5.05 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.3,
    color: "#0f172a",
    text: "Two GND endpoints cannot assign an unowned trace to GND",
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
