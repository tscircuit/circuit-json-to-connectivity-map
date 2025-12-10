import type { AnyCircuitElement } from "circuit-json"
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
      const route = Array.isArray(element.route)
        ? element.route.filter((rp) => rp && rp.route_type === "wire")
        : []
      if (source_trace_id && pcb_trace_id) {
        connections.push([pcb_trace_id, source_trace_id])
      }
      if (Array.isArray(route)) {
        const startId = route.find(
          (rp) => rp?.start_pcb_port_id,
        )?.start_pcb_port_id
        const endId = route.find((rp) => rp?.end_pcb_port_id)?.end_pcb_port_id
        if (startId && pcb_trace_id && endId) {
          connections.push([startId, pcb_trace_id, endId])
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
