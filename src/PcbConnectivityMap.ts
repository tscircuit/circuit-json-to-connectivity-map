import type { AnyCircuitElement, PCBTrace } from "@tscircuit/soup"
import { ConnectivityMap } from "./ConnectivityMap"
import { lineIntersectsLine } from "./math-utils/line-intersects-line"
import { findConnectedNetworks } from "./findConnectedNetworks"

/**
 * A PCB Connectivity Map is a connectivity map that has analyzed what traces and ports are actually connected on the
 * PCB.
 *
 * This is useful for determining how to route a trace on the PCB. For example, you may want to determine where the
 * nearest connected net point is to connect an unrouted pin.
 */
export class PcbConnectivityMap {
  circuitJson: AnyCircuitElement[]
  traceMap: Map<string, PCBTrace>
  connectivityMap: ConnectivityMap

  constructor(circuitJson: AnyCircuitElement[]) {
    this.circuitJson = circuitJson
    this.traceMap = new Map()
    this._buildTraceMap()
    this.connectivityMap = this.buildConnectivityMap()
  }

  private _buildTraceMap() {
    for (const element of this.circuitJson) {
      if (element.type === "pcb_trace") {
        this.traceMap.set(element.pcb_trace_id, element as PCBTrace)
      }
    }
  }

  private buildConnectivityMap(): ConnectivityMap {
    const connections: string[][] = []
    const traceIds = Array.from(this.traceMap.keys())

    for (let i = 0; i < traceIds.length; i++) {
      for (let j = i + 1; j < traceIds.length; j++) {
        const trace1 = this.traceMap.get(traceIds[i])!
        const trace2 = this.traceMap.get(traceIds[j])!
        if (this._arePcbTracesConnected(trace1, trace2)) {
          connections.push([traceIds[i], traceIds[j]])
        }
      }
    }

    return new ConnectivityMap(findConnectedNetworks(connections))
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

  areTracesConnected(traceId1: string, traceId2: string): boolean {
    return this.connectivityMap.areIdsConnected(traceId1, traceId2)
  }

  getAllTracesConnectedToTrace(traceId: string): string[] {
    const netId = this.connectivityMap.getNetConnectedToId(traceId)
    return netId ? this.connectivityMap.getIdsConnectedToNet(netId) : []
  }

  getAllTracesConnectedToPort(portId: string): PCBTrace[] {
    // This method is not implemented yet, as it requires additional information about how ports are connected to traces.
    // For now, we'll throw an error.
    throw new Error("getAllTracesConnectedToPort is not implemented yet")
  }
}
