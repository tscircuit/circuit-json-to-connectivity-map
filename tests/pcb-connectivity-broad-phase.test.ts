import { expect, test } from "bun:test"
import { doesLineIntersectLine } from "@tscircuit/math-utils"
import { PcbConnectivityMap } from "../src/PcbConnectivityMap"
import { makeStraightPcbTrace } from "./fixtures/make-straight-pcb-trace"

test("broad phase preserves continuous contacts at tangency and across translations", () => {
  const map = new PcbConnectivityMap()
  let seed = 23
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32
  for (let i = 0; i < 4000; i++) {
    const x = random() * 40 - 20,
      y = random() * 40 - 20
    const a = { x, y },
      b = { x: x + random() * 3, y: y + random() * 3 }
    const c = { x: x + random() - 0.5, y: y + random() - 0.5 }
    const d = i % 3 ? { x: c.x + random() * 3, y: c.y + random() * 3 } : c
    const first = makeStraightPcbTrace("first", "top", a, b)
    const second = makeStraightPcbTrace("second", "top", c, d)
    const widthA = 0.1 + random(),
      widthB = 0.1 + random()
    for (const point of first.route)
      if (point.route_type === "wire") point.width = widthA
    for (const point of second.route)
      if (point.route_type === "wire") point.width = widthB
    expect(map._arePcbTracesConnected(first, second)).toBe(
      doesLineIntersectLine([a, b], [c, d], {
        lineThickness: (widthA + widthB) / 2,
      }),
    )
  }
  for (const gap of [0.199999999, 0.2, 0.200000001]) {
    const first = makeStraightPcbTrace(
      "a",
      "top",
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    )
    const second = makeStraightPcbTrace(
      "b",
      "top",
      { x: -1, y: gap },
      { x: 1, y: gap },
    )
    expect(map._arePcbTracesConnected(first, second)).toBe(gap <= 0.2)
  }
})
