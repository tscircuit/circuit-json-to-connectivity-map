import type { AnySoupElement } from "@tscircuit/soup"
import { findConnectedNetworks } from "./findConnectedNetworks"

export const getSoupPortConnectivityMapFromCircuitJson = (
  circuitJson: AnySoupElement[],
) => {
  const connectivityMap = new Map<string, string[]>()

  const connections: string[][] = []

  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      connections.push(element.connected_source_port_ids)
    }
  }

  const connectedNetworks = findConnectedNetworks(connections)

  for (const network of connectedNetworks) {
    connectivityMap.set(network.netId, network.connectedNodeIds)
  }

  return connectivityMap
}
