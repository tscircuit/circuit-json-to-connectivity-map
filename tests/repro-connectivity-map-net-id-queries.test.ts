import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

// Repro: areIdsConnected should also work when one of its arguments is a net id
// (e.g. "connectivity_net0") instead of an element id. A net id is connected to
// every element in that net, so querying a net id against one of its members
// should return true. Today it returns false because the method bails out early
// when getNetConnectedToId(netId) is undefined (a net id is not a key in
// idToNetMap).
test.failing("areIdsConnected supports net-id arguments", () => {
  const connMap = new ConnectivityMap({
    connectivity_net0: ["port1", "port2"],
  })

  // element <-> element on the same net already works
  expect(connMap.areIdsConnected("port1", "port2")).toBe(true)

  // ...but a net id as either argument is wrongly reported as disconnected
  expect(connMap.areIdsConnected("connectivity_net0", "port1")).toBe(true)
  expect(connMap.areIdsConnected("port1", "connectivity_net0")).toBe(true)
})
