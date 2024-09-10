type NodeId = string

export function findConnectedNetworks(
  connections: Array<NodeId[]>,
): Array<{ netId: string; connectedNodeIds: string[] }> {
  const networks: Map<string, Set<string>> = new Map()
  let netCounter = 0

  function getOrCreateNetwork(nodeId: string): Set<string> {
    for (const [, network] of networks) {
      if (network.has(nodeId)) {
        return network
      }
    }
    const newNetwork = new Set<string>()
    networks.set(`net_${netCounter++}`, newNetwork)
    return newNetwork
  }

  for (const connection of connections) {
    let network: Set<string> | null = null

    for (const nodeId of connection) {
      if (!network) {
        network = getOrCreateNetwork(nodeId)
      } else if (!network.has(nodeId)) {
        const existingNetwork = getOrCreateNetwork(nodeId)
        if (existingNetwork !== network) {
          // Merge networks
          for (const node of existingNetwork) {
            network.add(node)
          }
          networks.delete(
            Array.from(networks.entries()).find(
              ([, net]) => net === existingNetwork,
            )![0],
          )
        }
      }
      network.add(nodeId)
    }
  }

  return Array.from(networks.entries()).map(([netId, connectedNodes]) => ({
    netId,
    connectedNodeIds: Array.from(connectedNodes),
  }))
}
