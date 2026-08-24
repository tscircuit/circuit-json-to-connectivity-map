import { expect, test } from "bun:test"
import type { AnyCircuitElement, PCBTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import { makeStraightPcbTrace } from "./fixtures/make-straight-pcb-trace"

test("connects a bottom-layer trace at a via transition", () => {
  const traceWithVia: PCBTrace = {
    type: "pcb_trace",
    pcb_trace_id: "trace_with_via",
    route: [
      { x: -1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      { x: 0, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      {
        x: 0,
        y: 0,
        route_type: "via",
        from_layer: "top",
        to_layer: "bottom",
      },
      { x: 0, y: 0, route_type: "wire", width: 0.2, layer: "bottom" },
      { x: 1, y: 0, route_type: "wire", width: 0.2, layer: "bottom" },
    ],
  }
  const bottomTrace = makeStraightPcbTrace(
    "bottom_trace",
    "bottom",
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  )

  const connectivityMap = new PcbConnectivityMap([
    traceWithVia,
    bottomTrace,
  ] as AnyCircuitElement[])

  expect(
    connectivityMap.areTracesConnected(
      traceWithVia.pcb_trace_id,
      bottomTrace.pcb_trace_id,
    ),
  ).toBe(true)
})
