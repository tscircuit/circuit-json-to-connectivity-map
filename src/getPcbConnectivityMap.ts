import type { PcbConnectivityMap } from "./PcbConnectivityMap"
import type { AnyCircuitElement, PCBPort, PCBTrace } from "@tscircuit/soup"

type Point = {
  x: number
  y: number
}

export function lineIntersectsLine(
  [a1, a2]: [Point, Point],
  [b1, b2]: [Point, Point],
  {
    lineThickness = 0,
  }: {
    lineThickness?: number
  } = {},
): boolean {}

export function arePcbTracesConnected(
  trace1: PCBTrace,
  trace2: PCBTrace,
): boolean {
  for (let i = 0; i < trace1.route.length - 1; i++) {
    const segment1A = trace1.route[i]
    const segment1B = trace1.route[i + 1]
    if (segment1A.route_type !== "wire") continue
    if (segment1B.route_type !== "wire") continue
    for (let j = 0; j < trace2.route.length - 1; j++) {
      const segment2A = trace2.route[j]
      const segment2B = trace2.route[j + 1]

      if (segment2A.route_type !== "wire") continue
      if (segment2B.route_type !== "wire") continue

      // Check if lines are overlapping
      const isOverlapping = lineIntersectsLine(
        [segment1A, segment1B],
        [segment2A, segment2B],
        {
          lineThickness: (segment1A.width + segment2A.width) / 2,
        },
      )
    }
  }
}

export function isPcbTraceConnectedToPcbPort(
  trace: PCBTrace,
  port: PCBPort,
): boolean {}

/**
 * Returns a map of physically connected pcb_traces for the given source ports.
 *
 * Use this to find the nearest connection point for a trace.
 */
export function getPcbConnectivityMapForSourcePorts(params: {
  circuitJson: AnyCircuitElement[]
  pcbPortIds: string[]
}): PcbConnectivityMap {}
