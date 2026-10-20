import { test } from "bun:test"
import { strict as assert } from "node:assert"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("pair and all-ID queries agree for an empty-string net name", () => {
  const map = new ConnectivityMap({ "": ["a", "b"] })
  assert.equal(map.areAllIdsConnected(["a", "b"]), true)
  assert.equal(map.areIdsConnected("a", "b"), true)
  assert.equal(map.areIdsConnected("b", "a"), true)
  assert.equal(map.getNetConnectedToId("a"), "")
})

test("extending an empty-string net preserves its original members", () => {
  const map = new ConnectivityMap({ "": ["a", "b"] })
  map.addConnections([["a", "c"]])
  assert.deepEqual(map.getIdsConnectedToNet(""), ["a", "b", "c"])
  assert.equal(map.areAllIdsConnected(["a", "b", "c"]), true)
  assert.deepEqual(Object.keys(map.netMap), [""])
})

for (const connection of [
  ["a", "c"],
  ["c", "a"],
]) {
  test(`merging an empty-string net in order ${connection}`, () => {
    const map = new ConnectivityMap({ "": ["a", "b"], other: ["c", "d"] })
    map.addConnections([connection])
    assert.equal(map.areAllIdsConnected(["a", "b", "c", "d"]), true)
    assert.equal(map.areIdsConnected("b", "d"), true)
    assert.equal(map.getIdsConnectedToNet("").length, 4)
    assert.equal(map.getIdsConnectedToNet("other").length, 4)
  })
}

test("unknown IDs are not mistaken for empty-string net members", () => {
  const map = new ConnectivityMap({ "": ["a", "b"] })
  assert.equal(map.areIdsConnected("a", "missing"), false)
  assert.equal(map.areIdsConnected("missing", "b"), false)
  assert.equal(map.areIdsConnected("missing", "otherMissing"), false)
})

test("ordinary net names retain their existing behavior", () => {
  const map = new ConnectivityMap({ first: ["a", "b"], second: ["c"] })
  map.addConnections([["b", "c"]])
  assert.equal(map.areAllIdsConnected(["a", "b", "c"]), true)
  assert.equal(map.areIdsConnected("a", "c"), true)
})
