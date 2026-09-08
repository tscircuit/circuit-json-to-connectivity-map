import { test } from "bun:test"
import { strict as assert } from "node:assert"
import { ConnectivityMap } from "../src/ConnectivityMap"

for (const count of [4, 180_000]) {
  test(`merging ${count} members does not require one argument per member`, () => {
    const members = Array.from({ length: count }, (_, i) => `b${i}`)
    const map = new ConnectivityMap({ first: ["a"], second: members })
    map.addConnections([["a", "b0"]])
    const merged = map.getIdsConnectedToNet("first")
    assert.equal(merged.length, count + 1)
    assert.equal(merged[0], "a")
    assert.equal(merged[count], `b${count - 1}`)
    assert.equal(new Set(merged).size, count + 1)
    assert.equal(map.areAllIdsConnected(["a", "b0", `b${count - 1}`]), true)
    assert.equal(map.getIdsConnectedToNet("second"), merged)
    map.addConnections([["a", "new"], ["b0", "a"]])
    assert.equal(merged.length, count + 2)
    assert.equal(merged[count + 1], "new")
  })
}

test("a large target also retains membership when absorbing a small net", () => {
  const members = Array.from({ length: 180_000 }, (_, i) => `a${i}`)
  const map = new ConnectivityMap({ first: members, second: ["b"] })
  map.addConnections([["a0", "b"]])
  assert.equal(map.getIdsConnectedToNet("first").length, 180_001)
  assert.equal(map.areAllIdsConnected(["a0", "a179999", "b"]), true)
})
