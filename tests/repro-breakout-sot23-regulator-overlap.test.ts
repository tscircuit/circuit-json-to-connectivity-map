import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import circuitJsonFixture from "./assets/repro-breakout-sot23-regulator-overlap.json"

test("repro breakout sot23 regulator overlap connectivity", () => {
  const circuitJson = circuitJsonFixture as AnyCircuitElement[]
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // BUG: these one-ended merged branch traces should be connected by the
  // source_trace ids encoded in connection_name.
  expect(
    connMap.areIdsConnected(
      "source_trace_3__source_trace_5_mst0_0",
      "source_trace_3__source_trace_5_mst1_0",
    ),
  ).toBe(false)
  expect(
    connMap.areIdsConnected(
      "source_trace_3__source_trace_5_mst0_0",
      "source_trace_3",
    ),
  ).toBe(false)
})
