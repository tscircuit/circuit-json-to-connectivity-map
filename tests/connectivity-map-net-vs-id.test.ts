import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

// net ids and element ids are separate sets. A net id (e.g. "connectivity_net0")
// is not a substitute for an element id, so querying a net id against one of its
// members returns false. To make a net id connectable, list it as a member.
test("areIdsConnected treats net ids and element ids as separate sets", () => {
  const connMap = new ConnectivityMap({
    connectivity_net0: ["port1", "port2"],
  })

  // elements on the same net are connected
  expect(connMap.areIdsConnected("port1", "port2")).toBe(true)

  // a net id is not accepted as a stand-in for an element id
  expect(connMap.areIdsConnected("connectivity_net0", "port1")).toBe(false)
  expect(connMap.areIdsConnected("port1", "connectivity_net0")).toBe(false)
})

test("a net id becomes connectable when listed as a member of its net", () => {
  const connMap = new ConnectivityMap({
    connectivity_net0: ["connectivity_net0", "port1"],
  })

  expect(connMap.areIdsConnected("connectivity_net0", "port1")).toBe(true)
  expect(connMap.areIdsConnected("port1", "connectivity_net0")).toBe(true)
})
