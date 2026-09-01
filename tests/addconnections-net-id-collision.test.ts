import { test, expect } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

// A net map can have gapped / non-sequential keys — findConnectedNetworks emits
// them (e.g. just { connectivity_net1: [...] }). addConnections derived a NEW net
// id from Object.keys(netMap).length, which collides with such a key and clobbers
// the existing net.
test.failing(
  "addConnections does not reuse a net id already present in a gapped net map",
  () => {
    const connMap = new ConnectivityMap({ connectivity_net1: ["A", "B"] })

    connMap.addConnections([["X", "Y"]])

    // X/Y is a brand-new, unrelated connection: it must not merge into A/B's net
    expect(connMap.areIdsConnected("A", "X")).toBe(false)
    expect(connMap.areIdsConnected("A", "B")).toBe(true)
    expect(connMap.areIdsConnected("X", "Y")).toBe(true)
  },
)
