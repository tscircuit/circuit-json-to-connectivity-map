import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { AnyCircuitElement } from "circuit-json"
import {
  getFullConnectivityMapFromCircuitJson,
  getSourcePortConnectivityMapFromCircuitJson,
} from "../src"

test("the full NEMA8 board merges VM and GND through a PCB endpoint", () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL("./fixtures/nema8-controller/circuit.json.gz", import.meta.url),
    ),
  )
  const circuitJson = JSON.parse(bytes.toString("utf8")) as AnyCircuitElement[]

  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    "32f2eaaa2d3878ec108a9f8789e857d26a17b4bebeddd2d4aabfb1d923c373c1",
  )
  expect(circuitJson).toHaveLength(2469)

  const sourceConnectivity =
    getSourcePortConnectivityMapFromCircuitJson(circuitJson)
  expect(
    sourceConnectivity.areIdsConnected("source_port_155", "source_port_150"),
  ).toBe(false)

  const fullConnectivity = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(
    fullConnectivity.areIdsConnected("source_port_155", "source_port_150"),
  ).toBe(true)
  expect(
    fullConnectivity.areIdsConnected("source_trace_8", "pcb_port_150"),
  ).toBe(true)
})
