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
      if (nextNetId !== netId) {
        return false
      }
    }
    return true
  }
}
