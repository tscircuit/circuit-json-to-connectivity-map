import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import { makeStraightPcbTrace } from "./fixtures/make-straight-pcb-trace"

test("connects geometrically crossing traces on the same layer", () => {
  const horizontalTrace = makeStraightPcbTrace(
    "horizontal_trace",
    "top",
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  )
  const verticalTrace = makeStraightPcbTrace(
    "vertical_trace",
    "top",
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  )

  const connectivityMap = new PcbConnectivityMap([
    horizontalTrace,
    verticalTrace,
  ] as AnyCircuitElement[])

  expect(
    connectivityMap.areTracesConnected(
      horizontalTrace.pcb_trace_id,
      verticalTrace.pcb_trace_id,
    ),
  ).toBe(true)
})
