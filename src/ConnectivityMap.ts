export class ConnectivityMap {
  netMap: Record<string, string[]>

  idToNetMap: Record<string, string>

  constructor(netMap: Record<string, string[]>) {
    this.netMap = netMap
    this.idToNetMap = {}
    for (const [netId, ids] of Object.entries(netMap)) {
      for (const id of ids) {
        this.idToNetMap[id] = netId
      }
    }
  }

  addConnections(connections: string[][]) {
    for (const connection of connections) {
      const existingNets = new Set<string>()

      // Find all existing nets for the connection
      for (const id of connection) {
        const existingNetId = this.idToNetMap[id]
        if (existingNetId) {
          existingNets.add(existingNetId)
        }
      }

      let targetNetId: string

      if (existingNets.size === 0) {
        // If no existing nets found, create a new one
        targetNetId = this.getNextNetId()
        this.netMap[targetNetId] = []
      } else if (existingNets.size === 1) {
        // If only one existing net found, use it
        targetNetId = existingNets.values().next().value ?? this.getNextNetId()
      } else {
        // If multiple nets found, merge them
        targetNetId = existingNets.values().next().value ?? this.getNextNetId()
        for (const netId of existingNets) {
          if (netId !== targetNetId) {
            this.netMap[targetNetId].push(...this.netMap[netId])

            // we could delete the net, but setting it to reference the other net
            // will make sure any usage of the old netId will still work
            this.netMap[netId] = this.netMap[targetNetId]
            for (const id of this.netMap[targetNetId]) {
              this.idToNetMap[id] = targetNetId
            }
          }
        }
      }

      // Add all ids to the target net
      for (const id of connection) {
        if (!this.netMap[targetNetId].includes(id)) {
          this.netMap[targetNetId].push(id)
        }
        this.idToNetMap[id] = targetNetId
      }
    }
  }

  // Net keys are not always a dense 0..n-1 range (findConnectedNetworks can
  // leave gaps), so pick the first connectivity_net<i> that is not already a
  // key instead of deriving one from the key count, which would collide.
  getNextNetId(): string {
    let index = Object.keys(this.netMap).length
    while (this.netMap[`connectivity_net${index}`] !== undefined) {
      index++
    }
    return `connectivity_net${index}`
  }

  getIdsConnectedToNet(netId: string): string[] {
    return this.netMap[netId] || []
  }

  getNetConnectedToId(id: string): string | undefined {
    return this.idToNetMap[id]
  }

  areIdsConnected(id1: string, id2: string): boolean {
    if (id1 === id2) return true
    const netId1 = this.getNetConnectedToId(id1)
    if (!netId1) return false
    const netId2 = this.getNetConnectedToId(id2)
    if (!netId2) return false
    return netId1 === netId2 || netId2 === id1 || netId2 === id1
  }

  areAllIdsConnected(ids: string[]): boolean {
    const netId = this.getNetConnectedToId(ids[0])
    for (const id of ids) {
      const nextNetId = this.getNetConnectedToId(id)
      if (nextNetId === undefined) {
        return false
      }
      if (nextNetId !== netId) {
        return false
      }
    }
    return true
  }
}
