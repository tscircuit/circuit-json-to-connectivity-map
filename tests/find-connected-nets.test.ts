import { test, expect } from "bun:test"
import { findConnectedNetworks } from "../src"

test("should create basic connectivity map", () => {
  // Example usage
  const connections: Array<string[]> = [
    ["A", "B"],
    ["B", "C"],
    ["D", "E"],
    ["F", "G", "H"],
    ["I"],
    ["G", "J"],
  ]

  const result = findConnectedNetworks(connections)

  expect(result).toEqual({
    connectivity_net0: ["A", "B", "C"],
    connectivity_net3: ["D", "E"],
    connectivity_net5: ["F", "G", "H", "J"],
    connectivity_net8: ["I"],
  })
})
