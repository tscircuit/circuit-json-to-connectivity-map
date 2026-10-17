type NodeId = string
type ConnectivityNetId = `connectivity_net${number}`

type NetworkMember = {
  nodeId: NodeId
  nextMember: NetworkMember | null
}

// The linked member list preserves the legacy insertion order while roots merge
// in constant time.
type NetworkRoot = {
  parent: NetworkRoot | null
  networkId: ConnectivityNetId
  firstMember: NetworkMember
  lastMember: NetworkMember
}

type NetworkLookupContext = {
  rootByNodeId: Map<NodeId, NetworkRoot>
  nextNetworkNumber: number
}

function findNetworkRoot(networkRoot: NetworkRoot): NetworkRoot {
  let canonicalRoot = networkRoot
  while (canonicalRoot.parent !== null) canonicalRoot = canonicalRoot.parent

  // Compress the traversed path so repeated node lookups remain inexpensive.
  let currentRoot = networkRoot
  while (currentRoot.parent !== null && currentRoot.parent !== canonicalRoot) {
    const parentRoot = currentRoot.parent
    currentRoot.parent = canonicalRoot
    currentRoot = parentRoot
  }

  return canonicalRoot
}

function createNetworkRoot(
  nodeId: NodeId,
  ctx: NetworkLookupContext,
): NetworkRoot {
  const member: NetworkMember = { nodeId, nextMember: null }
  const networkRoot: NetworkRoot = {
    parent: null,
    networkId: `connectivity_net${ctx.nextNetworkNumber++}`,
    firstMember: member,
    lastMember: member,
  }
  ctx.rootByNodeId.set(nodeId, networkRoot)
  return networkRoot
}

function getOrCreateNetworkRoot(
  nodeId: NodeId,
  ctx: NetworkLookupContext,
): NetworkRoot {
  const networkRoot = ctx.rootByNodeId.get(nodeId)
  return networkRoot === undefined
    ? createNetworkRoot(nodeId, ctx)
    : findNetworkRoot(networkRoot)
}

function mergeNetworkRoots({
  targetRoot,
  sourceRoot,
}: {
  targetRoot: NetworkRoot
  sourceRoot: NetworkRoot
}): void {
  targetRoot.lastMember.nextMember = sourceRoot.firstMember
  targetRoot.lastMember = sourceRoot.lastMember
  sourceRoot.parent = targetRoot
}

function getNetworkNodeIds(networkRoot: NetworkRoot): NodeId[] {
  const nodeIds: NodeId[] = []
  let member: NetworkMember | null = networkRoot.firstMember
  while (member !== null) {
    nodeIds.push(member.nodeId)
    member = member.nextMember
  }
  return nodeIds
}

export function findConnectedNetworks(
  connections: Array<NodeId[]>,
): Record<string, string[]> {
  const ctx: NetworkLookupContext = {
    rootByNodeId: new Map(),
    nextNetworkNumber: 0,
  }

  for (const connection of connections) {
    let targetRoot: NetworkRoot | null = null

    for (const nodeId of connection) {
      const sourceRoot = getOrCreateNetworkRoot(nodeId, ctx)
      if (targetRoot === null) {
        targetRoot = sourceRoot
        continue
      }

      targetRoot = findNetworkRoot(targetRoot)
      if (sourceRoot !== targetRoot) {
        mergeNetworkRoots({ targetRoot, sourceRoot })
      }
    }
  }

  const networks: Record<ConnectivityNetId, NodeId[]> = {}
  for (const networkRoot of ctx.rootByNodeId.values()) {
    if (networkRoot.parent !== null) continue
    networks[networkRoot.networkId] = getNetworkNodeIds(networkRoot)
  }
  return networks
}
