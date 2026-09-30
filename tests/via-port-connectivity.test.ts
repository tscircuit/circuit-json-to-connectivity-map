import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

// Minimal reproduction of the bottom-port routing in check-shorts PR #63.
const circuitJson: AnyCircuitElement[] = [
  {
    type: "source_net",
    source_net_id: "gnd",
    name: "GND",
    member_source_group_ids: [],
  },
  ...[0, 1].map((index) => ({
    type: "pcb_via" as const,
    pcb_via_id: `via_${index}`,
    source_net_id: "gnd",
    pcb_port_ids: [`top_${index}`, `bottom_${index}`],
    x: 0,
    y: index,
    layers: ["top", "bottom"] as const,
  })),
  {
    type: "pcb_trace",
    pcb_trace_id: "bottom_trace",
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        width: 0.15,
        layer: "bottom",
        start_pcb_port_id: "bottom_0",
      },
      {
        route_type: "wire",
        x: 0,
        y: 1,
        width: 0.15,
        layer: "bottom",
        end_pcb_port_id: "bottom_1",
      },
    ],
  },
]

test("connects a trace without a source trace ID through its vias' bottom ports", () => {
  const map = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(
    map.areAllIdsConnected([
      "gnd",
      "via_0",
      "via_1",
      "top_0",
      "top_1",
      "bottom_0",
      "bottom_1",
      "bottom_trace",
    ]),
  ).toBe(true)
})

test("connects a via's ports even without source or trace metadata", () => {
  const via: AnyCircuitElement = {
    type: "pcb_via",
    pcb_via_id: "isolated_via",
    pcb_port_ids: ["isolated_top", "isolated_bottom"],
    x: 0,
    y: 0,
    layers: ["top", "bottom"],
  }
  const map = getFullConnectivityMapFromCircuitJson([via])

  expect(
    map.areAllIdsConnected(["isolated_via", "isolated_top", "isolated_bottom"]),
  ).toBe(true)
})

test("does not infer trace identity from physical overlap with vias", () => {
  const unidentified = structuredClone(circuitJson)
  for (const element of unidentified) {
    if (element.type !== "pcb_trace") continue
    for (const point of element.route) {
      if (point.route_type !== "wire") continue
      delete point.start_pcb_port_id
      delete point.end_pcb_port_id
    }
  }
  const map = getFullConnectivityMapFromCircuitJson(unidentified)

  expect(map.areIdsConnected("bottom_trace", "gnd")).toBe(false)
  expect(map.areIdsConnected("bottom_trace", "via_0")).toBe(false)
})

test("keeps an overlapping different-net via separate", () => {
  const signalVia: AnyCircuitElement = {
    type: "pcb_via",
    pcb_via_id: "signal_via",
    source_net_id: "signal_net",
    pcb_port_ids: ["signal_top", "signal_bottom"],
    x: 0,
    y: 0.5,
    layers: ["top", "bottom"],
  }
  const map = getFullConnectivityMapFromCircuitJson([...circuitJson, signalVia])

  expect(map.areIdsConnected("signal_via", "bottom_trace")).toBe(false)
  expect(map.areIdsConnected("signal_bottom", "gnd")).toBe(false)
  expect(
    map.areAllIdsConnected([
      "signal_via",
      "signal_net",
      "signal_top",
      "signal_bottom",
    ]),
  ).toBe(true)
})
