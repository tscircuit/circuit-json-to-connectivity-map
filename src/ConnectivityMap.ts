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
      let netId: string | undefined

      // Find an existing net for the connection
      for (const id of connection) {
        const existingNetId = this.idToNetMap[id]
        if (existingNetId) {
          netId = existingNetId
          break
        }
      }

      // If no existing net found, create a new one
      if (!netId) {
        netId = `connectivity_net${Object.keys(this.netMap).length}`
        this.netMap[netId] = []
      }

      // Add all ids to the net
      for (const id of connection) {
        if (!this.netMap[netId].includes(id)) {
          this.netMap[netId].push(id)
        }
        this.idToNetMap[id] = netId
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
    const netId1 = this.getNetConnectedToId(id1)
    const netId2 = this.getNetConnectedToId(id2)
    return netId1 === netId2 || netId2 === id1 || netId2 === id1
  }

  areAllIdsConnected(ids: string[]): boolean {
    let netId = this.getNetConnectedToId(ids[0])
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
