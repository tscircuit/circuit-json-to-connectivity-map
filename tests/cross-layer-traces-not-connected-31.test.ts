import { expect, test } from "bun:test"
import type { PCBTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

// https://github.com/tscircuit/circuit-json-to-connectivity-map/issues/31
//
// _arePcbTracesConnected checked geometric intersection without comparing
// route-point layers, so a top-layer trace crossing a bottom-layer trace
// was reported as electrically connected even though there is no via.
test("crossing traces on different layers are not connected", () => {
  const map = new PcbConnectivityMap([
    {
      type: "pcb_trace",
      pcb_trace_id: "top_trace",
      route: [
        { x: -1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
        { x: 1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      ],
    } as PCBTrace,
    {
      type: "pcb_trace",
      pcb_trace_id: "bottom_trace",
      route: [
        { x: 0, y: -1, route_type: "wire", width: 0.2, layer: "bottom" },
        { x: 0, y: 1, route_type: "wire", width: 0.2, layer: "bottom" },
      ],
    } as PCBTrace,
  ])

  expect(map.areTracesConnected("top_trace", "bottom_trace")).toBe(false)
})

test("crossing traces on the same layer remain connected", () => {
  const map = new PcbConnectivityMap([
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_a",
      route: [
        { x: -1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
        { x: 1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      ],
    } as PCBTrace,
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_b",
      route: [
        { x: 0, y: -1, route_type: "wire", width: 0.2, layer: "top" },
        { x: 0, y: 1, route_type: "wire", width: 0.2, layer: "top" },
      ],
    } as PCBTrace,
  ])

  expect(map.areTracesConnected("trace_a", "trace_b")).toBe(true)
})
