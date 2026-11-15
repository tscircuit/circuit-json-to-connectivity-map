import { expect, test } from "bun:test"
import type { PcbVia } from "circuit-json"
import { getPcbViaSpanLayers, getViaSpanLayers } from "../src/getViaSpanLayers"

test("getViaSpanLayers expands forward and reverse spans across inner layers", () => {
  expect(
    getViaSpanLayers({
      fromLayer: "top",
      toLayer: "bottom",
      layerCount: 4,
    }),
  ).toEqual(["top", "inner1", "inner2", "bottom"])

  expect(
    getViaSpanLayers({
      fromLayer: "inner2",
      toLayer: "top",
      layerCount: 4,
    }),
  ).toEqual(["inner2", "inner1", "top"])
})

test("getPcbViaSpanLayers honors through_hole and explicit drill bounds", () => {
  const baseVia: PcbVia = {
    type: "pcb_via",
    pcb_via_id: "via_1",
    x: 0,
    y: 0,
    outer_diameter: 0.6,
    hole_diameter: 0.3,
    layers: ["top", "bottom"],
  }

  expect(getPcbViaSpanLayers({ ...baseVia, through_hole: true }, 4)).toEqual([
    "top",
    "inner1",
    "inner2",
    "bottom",
  ])

  expect(
    getPcbViaSpanLayers(
      {
        ...baseVia,
        layers: ["top", "inner2"],
        topmost_drill_layer: "top",
        bottommost_drill_layer: "inner2",
      },
      4,
    ),
  ).toEqual(["top", "inner1", "inner2"])
})
