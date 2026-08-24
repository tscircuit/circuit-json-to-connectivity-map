import { expect, test } from "bun:test"
import type { AnyCircuitElement, PCBTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

const makeStraightTrace = (
  pcbTraceId: string,
  layer: "top" | "bottom",
  start: { x: number; y: number },
  end: { x: number; y: number },
): PCBTrace => ({
  type: "pcb_trace",
  pcb_trace_id: pcbTraceId,
  route: [
    { ...start, route_type: "wire", width: 0.2, layer },
    { ...end, route_type: "wire", width: 0.2, layer },
  ],
})

test("connects geometrically crossing traces on the same layer", () => {
  const horizontalTrace = makeStraightTrace(
    "horizontal_trace",
    "top",
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  )
  const verticalTrace = makeStraightTrace(
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

test("does not connect geometrically crossing traces on different layers", () => {
  const topTrace = makeStraightTrace(
    "top_trace",
    "top",
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  )
  const bottomTrace = makeStraightTrace(
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
  const bottomTrace = makeStraightTrace(
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
