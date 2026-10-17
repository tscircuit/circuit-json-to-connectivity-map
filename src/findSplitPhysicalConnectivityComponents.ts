import type {
  PhysicalConnectivitySnapshot,
  PhysicalConnectivitySplit,
} from "./physical-connectivity-types"

/** Find previously connected terminal groups that split, allowing merges. */
export function findSplitPhysicalConnectivityComponents(
  baseline: PhysicalConnectivitySnapshot,
  candidate: PhysicalConnectivitySnapshot,
): PhysicalConnectivitySplit[] {
  const splits: PhysicalConnectivitySplit[] = []
  for (const baselineEndpointKeys of baseline.endpointComponents) {
    if (baselineEndpointKeys.length < 2) continue
    const candidateComponentsById = new Map<string | symbol, string[]>()
    for (const endpointKey of baselineEndpointKeys) {
      // Missing terminals need distinct keys that cannot collide with opaque IDs.
      const candidateComponentId =
        candidate.componentByEndpointKey[endpointKey] ?? Symbol()
      const endpointKeys =
        candidateComponentsById.get(candidateComponentId) ?? []
      endpointKeys.push(endpointKey)
      candidateComponentsById.set(candidateComponentId, endpointKeys)
    }
    if (candidateComponentsById.size <= 1) continue
    splits.push({
      baselineEndpointKeys: [...baselineEndpointKeys],
      baselineEndpointLabels: baselineEndpointKeys.map(
        (endpointKey) => baseline.endpointLabels[endpointKey]!,
      ),
      candidateComponents: [...candidateComponentsById.values()],
    })
  }
  return splits
}
