import { expect, test } from "bun:test"
import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type { PcbTrace } from "circuit-json"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"

test("connectivity bounds preserve exact segment contact across seeded and boundary cases", (): void => {
  const map = new PcbConnectivityMap()
  let seed = 18002
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  for (let sample = 0; sample < 2000; sample++) {
    const traces: PcbTrace[] = [0, 1].map((index) => ({
      type: "pcb_trace",
      pcb_trace_id: `trace_${index}`,
      route: Array.from({ length: 4 }, () => ({
        route_type: "wire" as const,
        x: random() * 10,
        y: random() * 10,
        width: random() * 0.8,
        layer: random() > 0.5 ? "top" : "bottom",
      })),
    }))
    if (sample < 10) {
      const height = [0, 0.1, 0.2, 0.200000001, 100][sample % 5]
      for (const [index, trace] of traces.entries()) {
        trace.route = [0, sample < 5 ? 2 : 0].map((x) => ({
          route_type: "wire" as const,
          x,
          y: index * height,
          width: 0.2,
          layer: "top",
        }))
      }
    }
    if (sample >= 10 && sample < 15) {
      const point = traces[0].route[0]
      if (point.route_type === "wire") {
        point.x = [NaN, Infinity, -Infinity, 0, 0][sample - 10]
        point.width = [0.2, 0.2, 0.2, 0, NaN][sample - 10]
      }
    }
    const [first, second] = traces
    let expected = false
    for (let i = 0; i < first.route.length - 1; i++) {
      for (let j = 0; j < second.route.length - 1; j++) {
        const a = first.route[i]
        const b = first.route[i + 1]
        const c = second.route[j]
        const d = second.route[j + 1]
        if (
          a.route_type !== "wire" ||
          b.route_type !== "wire" ||
          c.route_type !== "wire" ||
          d.route_type !== "wire" ||
          a.layer !== b.layer ||
          c.layer !== d.layer ||
          a.layer !== c.layer
        )
          continue
        expected ||= doesLineIntersectLine([a, b], [c, d], {
          lineThickness: (a.width + c.width) / 2,
        })
      }
    }
    expect(map._arePcbTracesConnected(first, second)).toBe(expected)
  }
})
