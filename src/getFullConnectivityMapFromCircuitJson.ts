import type { AnySoupElement } from "@tscircuit/soup"
import { findConnectedNetworks } from "./findConnectedNetworks"

export const getFullConnectivityMapFromCircuitJson = (
  circuitJson: AnySoupElement[],
) => {
  const connectivityMap = new Map<string, string[]>()

  const connections: string[][] = []

  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      connections.push([
        ...element.connected_source_port_ids,
        ...element.connected_source_net_ids,
      ])
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
    }
  }

  const connectedNetworks = findConnectedNetworks(connections)

  for (const network of connectedNetworks) {
    connectivityMap.set(network.netId, network.connectedNodeIds)
  }

  return connectivityMap
}
