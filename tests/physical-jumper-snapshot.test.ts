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

test("a jumper bridges its pads without connecting a trace under its insulated body", async () => {
  // Autorouter represents a jumper with a placeholder wire plus metadata.
  // Counting that placeholder as copper would invent a connection at the cross.
  const input: PhysicalConnectivityInput = {
    layerCount: 1,
    defaultViaDiameter: 0.6,
    endpoints: [
      { endpointKey: "left", endpointLabel: "L", point: { x: -0.825, y: 0 } },
      { endpointKey: "right", endpointLabel: "R", point: { x: 0.825, y: 0 } },
      {
        endpointKey: "under-bottom",
        endpointLabel: "bottom",
        point: { x: 0, y: -1 },
      },
      { endpointKey: "under-top", endpointLabel: "top", point: { x: 0, y: 1 } },
    ].map((endpoint) => ({ ...endpoint, layers: ["top"], netName: "NET" })),
    obstacles: [-0.825, 0.825].map((x) => ({
      type: "rect",
      center: { x, y: 0 },
      width: 0.8,
      height: 0.95,
      layers: ["top"],
      netNames: ["NET"],
    })),
    traces: [
      {
        pcb_trace_id: "bridge",
        netName: "NET",
        route: [
          { route_type: "wire", x: -0.825, y: 0, width: 0.1, layer: "top" },
          { route_type: "wire", x: 0.825, y: 0, width: 0.1, layer: "top" },
          {
            route_type: "jumper",
            start: { x: -0.825, y: 0 },
            end: { x: 0.825, y: 0 },
            footprint: "0603",
            layer: "top",
          },
        ],
      },
      {
        pcb_trace_id: "under-body",
        netName: "NET",
        route: [-1, 1].map((y) => ({
          route_type: "wire",
          x: 0,
          y,
          width: 0.1,
          layer: "top",
        })),
      },
    ],
  }
  const copperCrossing = structuredClone(input)
  copperCrossing.traces[0].route.pop()
  const jumper = capturePhysicalConnectivity(input)
  const copper = capturePhysicalConnectivity(copperCrossing)
  expect(jumper.endpointComponents).toEqual([
    ["left", "right"],
    ["under-bottom", "under-top"],
  ])
  expect(copper.endpointComponents).toEqual([
    ["left", "right", "under-bottom", "under-top"],
  ])

  const options = {
    scale: 125,
    center: { x: 0, y: 0 },
    labelOffsets: {
      left: [-24, -15],
      right: [12, -15],
      "under-bottom": [-28, 27],
    } as Record<string, [number, number]>,
  }
  await expect(
    physicalConnectivitySvg(
      "A jumper connection is insulated from copper below",
      "The same crossing geometry has different connectivity when the horizontal segment is a jumper.",
      [
        drawPhysicalConnectivity({
          ...options,
          input,
          snapshot: jumper,
          title: "0603 jumper: two physical components",
          note: "L connects to R; top connects only to bottom.",
        }),
        drawPhysicalConnectivity({
          ...options,
          input: copperCrossing,
          snapshot: copper,
          title: "Ordinary copper: one component",
          note: "Without jumper metadata, the copper lines touch.",
        }),
      ],
      "Dashed blue bridge: jumper connection. Gray body: insulation. Rectangles: conductive pads.",
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
