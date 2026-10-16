type NodeId = string

export function findConnectedNetworks(
  connections: Array<NodeId[]>,
): Record<string, string[]> {
  const networks: Map<string, Set<string>> = new Map()
  const networkByNode = new Map<string, Set<string>>()
  const idByNetwork = new Map<Set<string>, string>()
  let netCounter = 0

  function getOrCreateNetwork(nodeId: string): Set<string> {
    const existing = networkByNode.get(nodeId)
    if (existing) return existing
    const newNetwork = new Set<string>()
    const id = `connectivity_net${netCounter++}`
    networks.set(id, newNetwork)
    idByNetwork.set(newNetwork, id)
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
            networkByNode.set(node, network)
          }
          networks.delete(idByNetwork.get(existingNetwork)!)
          idByNetwork.delete(existingNetwork)
        }
      }
      network.add(nodeId)
      networkByNode.set(nodeId, network)
    }
  }

  return Object.fromEntries(
    Array.from(networks.entries()).map(([netId, connectedNodes]) => [
      netId,
      Array.from(connectedNodes),
    ]),
  )
}
