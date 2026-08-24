import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import { makeStraightPcbTrace } from "./fixtures/make-straight-pcb-trace"

test("does not connect geometrically crossing traces on different layers", () => {
  const topTrace = makeStraightPcbTrace(
    "top_trace",
    "top",
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  )
  const bottomTrace = makeStraightPcbTrace(
    "bottom_trace",
    "bottom",
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  )

  const connectivityMap = new PcbConnectivityMap([
    topTrace,
    bottomTrace,
  ] as AnyCircuitElement[])

  expect(
    connectivityMap.areTracesConnected(
      topTrace.pcb_trace_id,
      bottomTrace.pcb_trace_id,
    ),
  ).toBe(false)
})
