import { expect, test } from "bun:test"
import "bun-match-svg"
import {
  capturePhysicalConnectivity,
  type PhysicalConnectivityInput,
} from "../src"
import {
  drawPhysicalConnectivity,
  physicalConnectivitySvg,
} from "./fixtures/draw-physical-connectivity"

test("a shortcut through a round pad's bounds can disconnect its branch", async () => {
  // Widening or simplifying a route must preserve the branch terminal, not just
  // its two end terminals. A pad's rectangular bounds overestimate its copper.
  const input: PhysicalConnectivityInput = {
    layerCount: 1,
    defaultViaDiameter: 0.6,
    endpoints: [
      { endpointKey: "A", endpointLabel: "A", point: { x: -1, y: 3 } },
      { endpointKey: "B", endpointLabel: "B", point: { x: 3, y: -1 } },
      { endpointKey: "branch", endpointLabel: "branch", point: { x: 0, y: 0 } },
    ].map((endpoint) => ({ ...endpoint, layers: ["top"], netName: "NET" })),
    obstacles: [
      {
        type: "oval",
        center: { x: 0, y: 0 },
        width: 2,
        height: 2,
        layers: ["top"],
        netNames: ["NET"],
      },
    ],
    traces: [
      {
        pcb_trace_id: "route",
        netName: "NET",
        route: [
          [-1, 3],
          [0.6, 0.6],
          [3, -1],
        ].map(([x, y]) => ({
          route_type: "wire",
          x,
          y,
          width: 0.8,
          layer: "top",
        })),
      },
    ],
  }
  const shortcut = structuredClone(input)
  shortcut.traces[0].route.splice(1, 1)
  const before = capturePhysicalConnectivity(input)
  const after = capturePhysicalConnectivity(shortcut)
  expect(before.endpointComponents).toEqual([["A", "B", "branch"]])
  expect(after.endpointComponents).toEqual([["A", "B"], ["branch"]])
  expect(before.endpointCount).toBe(after.endpointCount)

  const options = {
    scale: 60,
    center: { x: 1, y: 1 },
    labelOffsets: { A: [-23, -20], B: [34, 25], branch: [-53, 83] } as Record<
      string,
      [number, number]
    >,
  }
  await expect(
    physicalConnectivitySvg(
      "A shorter route can lose a branch connection",
      "Physical connectivity checks the round copper outline, including the trace's 0.80 mm width.",
      [
        drawPhysicalConnectivity({
          ...options,
          input,
          snapshot: before,
          title: "Before: bent route touches the pad",
          note: "All three terminals share one copper component.",
        }),
        drawPhysicalConnectivity({
          ...options,
          input: shortcut,
          snapshot: after,
          title: "After: shortcut misses the pad",
          note: "A and B stay connected; the branch is isolated.",
        }),
      ],
      "Dashed square: pad bounds used for search. Filled circle: the actual conductive pad.",
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
