import { expect, test } from "bun:test"
import type { AnyCircuitElement, PCBTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

const horizontalTrace: PCBTrace = {
  type: "pcb_trace",
  pcb_trace_id: "trace_horizontal",
  route: [
    { x: 0, y: 0, route_type: "wire", width: 1, layer: "top" },
    { x: 10, y: 0, route_type: "wire", width: 1, layer: "top" },
  ],
}

const teeTrace: PCBTrace = {
  type: "pcb_trace",
  pcb_trace_id: "trace_tee",
  route: [
    { x: 5, y: -5, route_type: "wire", width: 1, layer: "top" },
    { x: 5, y: 0, route_type: "wire", width: 1, layer: "top" },
  ],
}

const otherLayerTrace: PCBTrace = {
  type: "pcb_trace",
  pcb_trace_id: "trace_other_layer",
  route: [
    { x: 5, y: -5, route_type: "wire", width: 1, layer: "bottom" },
    { x: 5, y: 0, route_type: "wire", width: 1, layer: "bottom" },
  ],
}

test("addTrace connects a trace that lands on an existing same-layer trace", () => {
  const batch = new PcbConnectivityMap([
    horizontalTrace,
    teeTrace,
  ] as AnyCircuitElement[])
  expect(batch.areTracesConnected("trace_horizontal", "trace_tee")).toBe(true)

  const incremental = new PcbConnectivityMap([
    horizontalTrace,
  ] as AnyCircuitElement[])
  incremental.addTrace(teeTrace)

  expect(incremental.areTracesConnected("trace_horizontal", "trace_tee")).toBe(
    true,
  )
  expect(
    incremental.connMap.getIdsConnectedToNet(
      incremental.connMap.getNetConnectedToId("trace_tee")!,
    ),
  ).toContain("trace_horizontal")
})

test("addTrace does not connect a trace crossing on a different layer", () => {
  const incremental = new PcbConnectivityMap([
    horizontalTrace,
  ] as AnyCircuitElement[])
  incremental.addTrace(otherLayerTrace)

  expect(
    incremental.areTracesConnected("trace_horizontal", "trace_other_layer"),
  ).toBe(false)
})
