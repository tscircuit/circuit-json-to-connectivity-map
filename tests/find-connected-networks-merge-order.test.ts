import { expect, test } from "bun:test"
import { findConnectedNetworks } from "../src/findConnectedNetworks"

test("preserves network identity and member order across reverse merges", () => {
  const networks = findConnectedNetworks([
    ["A", "B"],
    ["C", "D"],
    ["C", "A"],
    ["E"],
    ["E", "C"],
  ])

  expect(networks).toEqual({
    connectivity_net4: ["E", "C", "D", "A", "B"],
  })
})
