import type { AnyCircuitElement, PCBTrace } from "@tscircuit/soup"
import { ConnectivityMap } from "./ConnectivityMap"
import { lineIntersectsLine } from "./math-utils/line-intersects-line"

/**
 * A PCB Connectivity Map is a connectivity map that has analyzed what traces and ports are actually connected on the
 * PCB.
 *
 * This is useful for determining how to route a trace on the PCB. For example, you may want to determine where the
 * nearest connected net point is to connect an unrouted pin.
 */
export class PcbConnectivityMap {
  circuitJson: AnyCircuitElement[]

  constructor(circuitJson: AnyCircuitElement[]) {
    this.circuitJson = circuitJson
  }

  _arePcbTracesConnected(trace1: PCBTrace, trace2: PCBTrace): boolean {
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
        if (isOverlapping) {
          return true
        }
      }
    }
    return false
  }

  getAllTracesConnectedToPort(portId: string): PCBTrace[] {
    throw new Error("Not implemented")
  }
}
