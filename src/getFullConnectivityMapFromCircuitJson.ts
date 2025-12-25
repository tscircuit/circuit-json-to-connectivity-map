import type { AnyCircuitElement, PcbTraceRoutePointWire } from "circuit-json"
import { findConnectedNetworks } from "./findConnectedNetworks"
import { ConnectivityMap } from "./ConnectivityMap"

export const getFullConnectivityMapFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
) => {
  const connections: string[][] = []

  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      connections.push(
        [
          element.source_trace_id,
          ...(element.connected_source_port_ids ?? []),
          ...(element.connected_source_net_ids ?? []),
        ].filter(Boolean),
      )
    } else if (element.type === "pcb_port") {
      const { pcb_port_id, source_port_id } = element
      if (source_port_id && pcb_port_id) {
        connections.push([source_port_id, pcb_port_id])
      }
    } else if (element.type === "pcb_smtpad") {
      const { pcb_smtpad_id, pcb_port_id } = element
      if (pcb_port_id && pcb_smtpad_id) {
        connections.push([pcb_smtpad_id, pcb_port_id])
      }
    } else if (element.type === "pcb_plated_hole") {
      const { pcb_plated_hole_id, pcb_port_id } = element
      if (pcb_port_id && pcb_plated_hole_id) {
        connections.push([pcb_plated_hole_id, pcb_port_id])
      }
    } else if (element.type === "pcb_trace") {
      const { pcb_trace_id, source_trace_id } = element
      const route: PcbTraceRoutePointWire[] = Array.isArray(element.route)
        ? (element.route.filter(
            (rp): rp is PcbTraceRoutePointWire =>
              rp != null && rp.route_type === "wire",
          ) as PcbTraceRoutePointWire[])
        : []

      if (source_trace_id && pcb_trace_id) {
        // Handle combined source_trace_id like "source_net_4__source_net_5"
        if (source_trace_id.includes("__")) {
          const parts = source_trace_id.split("__")
          for (const part of parts) {
            if (part) {
              connections.push([pcb_trace_id, part])
            }
          }
        } else {
          connections.push([pcb_trace_id, source_trace_id])
        }
      }

      if (route.length > 0 && pcb_trace_id) {
        // Handle start/end port IDs independently
        const startId = route.find(
          (rp: PcbTraceRoutePointWire) => rp.start_pcb_port_id,
        )?.start_pcb_port_id
        const endId = route.find(
          (rp: PcbTraceRoutePointWire) => rp.end_pcb_port_id,
        )?.end_pcb_port_id

        if (startId) {
          connections.push([startId, pcb_trace_id])
        }
        if (endId) {
          connections.push([endId, pcb_trace_id])
        }
      }
    } else if (element.type === "pcb_via") {
      const { pcb_via_id, pcb_trace_id } = element
      if (pcb_trace_id && pcb_via_id) {
        connections.push([pcb_via_id, pcb_trace_id])
      }
    } else if (element.type === "source_component") {
      if (element.internally_connected_source_port_ids) {
        for (const portGroup of element.internally_connected_source_port_ids) {
          connections.push(portGroup)
        }
      }
    }
  }

  const netMap = findConnectedNetworks(connections)

  return new ConnectivityMap(netMap)
}
