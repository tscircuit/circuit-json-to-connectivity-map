const getIdsInNet = (
  netId: string,
  netMap: Record<string, string[]>,
  idsByNetArray: Map<string[], Set<string>>,
) => {
  const ids = netMap[netId]
  let idSet = idsByNetArray.get(ids)
  if (!idSet) {
    idSet = new Set(ids)
    idsByNetArray.set(ids, idSet)
  }
  return idSet
}

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
    const idsByNetArray = new Map<string[], Set<string>>()
    let netCount = Object.keys(this.netMap).length

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
        targetNetId = `connectivity_net${netCount++}`
        this.netMap[targetNetId] = []
      } else if (existingNets.size === 1) {
        // If only one existing net found, use it
        targetNetId =
          existingNets.values().next().value ?? `connectivity_net${netCount}`
      } else {
        // If multiple nets found, merge them
        targetNetId =
          existingNets.values().next().value ?? `connectivity_net${netCount}`
        const targetIds = this.netMap[targetNetId]
        const idsInTargetNet = getIdsInNet(
          targetNetId,
          this.netMap,
          idsByNetArray,
        )
        for (const netId of existingNets) {
          if (netId !== targetNetId) {
            for (const id of this.netMap[netId]) {
              targetIds.push(id)
              idsInTargetNet.add(id)
            }

            // we could delete the net, but setting it to reference the other net
            // will make sure any usage of the old netId will still work
            this.netMap[netId] = targetIds
            for (const id of targetIds) {
              this.idToNetMap[id] = targetNetId
            }
          }
        }
      }

      // Add all ids to the target net
      const targetIds = this.netMap[targetNetId]
      const idsInTargetNet = getIdsInNet(
        targetNetId,
        this.netMap,
        idsByNetArray,
      )
      for (const id of connection) {
        if (!idsInTargetNet.has(id)) {
          targetIds.push(id)
          idsInTargetNet.add(id)
        }
        this.idToNetMap[id] = targetNetId
      }
    }
  }

  getIdsConnectedToNet(netId: string): string[] {
    return this.netMap[netId] || []
  }

  getNetConnectedToId(id: string): string | undefined {
    return this.idToNetMap[id]
  }

  areIdsConnected(id1: string, id2: string): boolean {
    if (id1 === id2) return true
    const netId1 = this.idToNetMap[id1]
    if (!netId1) return false
    const netId2 = this.idToNetMap[id2]
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
