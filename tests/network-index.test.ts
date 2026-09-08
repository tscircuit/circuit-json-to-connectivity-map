import { test } from "bun:test"
import { strict as assert } from "node:assert"
import { findConnectedNetworks } from "../src/findConnectedNetworks"

test("disjoint pairs retain network IDs and insertion order", () => {
  const connections = Array.from({ length: 3_000 }, (_, i) => [
    `a${i}`,
    `b${i}`,
  ])
  const expected = Object.fromEntries(
    connections.map((nodes, i) => [`connectivity_net${i * 2}`, nodes]),
  )
  assert.deepEqual(findConnectedNetworks(connections), expected)
})

test("absorbed nodes resolve to the surviving network on later connections", () => {
  assert.deepEqual(
    findConnectedNetworks([
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
      ["c", "a"],
      ["b", "e"],
      ["f", "g"],
    ]),
    { connectivity_net2: ["c", "d", "a", "b", "e", "f", "g"] },
  )
})

test("empty and duplicate connections retain singleton and ordering behavior", () => {
  assert.deepEqual(findConnectedNetworks([[], ["a"], ["a", "a"], []]), {
    connectivity_net0: ["a"],
  })
  assert.deepEqual(findConnectedNetworks([]), {})
})

test("node indexes accept empty and prototype-like names without mutation", () => {
  const connections = [
    ["", "__proto__"],
    ["constructor", "toString"],
    ["__proto__", "constructor"],
  ]
  const original = JSON.stringify(connections)
  for (const nodes of connections) Object.freeze(nodes)
  Object.freeze(connections)
  assert.deepEqual(findConnectedNetworks(connections), {
    connectivity_net0: ["", "__proto__", "constructor", "toString"],
  })
  assert.equal(JSON.stringify(connections), original)
})
