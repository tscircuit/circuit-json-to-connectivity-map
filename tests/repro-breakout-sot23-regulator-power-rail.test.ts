import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import circuitJsonFixture from "./assets/repro-breakout-sot23-regulator-power-rail.json"

test("repro breakout sot23 regulator power rail connectivity", () => {
  const circuitJson = circuitJsonFixture as AnyCircuitElement[]
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // BUG: these one-ended merged branch traces should be connected by the
  // source_trace ids encoded in connection_name.
  expect(
    connMap.areIdsConnected(
      "source_trace_7__source_trace_9_mst0_0",
      "source_trace_7__source_trace_9_mst1_0",
    ),
  ).toBe(false)
  expect(
    connMap.areIdsConnected(
      "source_trace_7__source_trace_9_mst0_0",
      "source_trace_7",
    ),
  ).toBe(false)
  expect(
    connMap.areIdsConnected(
      "source_trace_4__source_trace_8_mst0_0",
      "source_trace_4__source_trace_8_mst1_0",
    ),
  ).toBe(false)
  expect(
    connMap.areIdsConnected(
      "source_trace_4__source_trace_8_mst0_0",
      "source_trace_4",
    ),
  ).toBe(false)
})
