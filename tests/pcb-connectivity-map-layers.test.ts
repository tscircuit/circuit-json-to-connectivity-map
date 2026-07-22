import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

test("crossing PCB traces on different layers are not connected", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "top_trace",
      route: [
        { x: -1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
        { x: 1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "bottom_trace",
      route: [
        { x: 0, y: -1, route_type: "wire", width: 0.2, layer: "bottom" },
        { x: 0, y: 1, route_type: "wire", width: 0.2, layer: "bottom" },
      ],
    },
  ]

  const connectivityMap = new PcbConnectivityMap(circuitJson)

  expect(connectivityMap.areTracesConnected("top_trace", "bottom_trace")).toBe(
    false,
  )
})

test("crossing PCB traces on the same layer remain connected", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "horizontal_trace",
      route: [
        { x: -1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
        { x: 1, y: 0, route_type: "wire", width: 0.2, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "vertical_trace",
      route: [
        { x: 0, y: -1, route_type: "wire", width: 0.2, layer: "top" },
        { x: 0, y: 1, route_type: "wire", width: 0.2, layer: "top" },
      ],
    },
  ]

  const connectivityMap = new PcbConnectivityMap(circuitJson)

  expect(
    connectivityMap.areTracesConnected("horizontal_trace", "vertical_trace"),
  ).toBe(true)
})
