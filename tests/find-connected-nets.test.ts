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

  expect(result).toEqual([
    {
      netId: "net_0",
      connectedNodeIds: ["A", "B", "C"],
    },
    {
      netId: "net_3",
      connectedNodeIds: ["D", "E"],
    },
    {
      netId: "net_5",
      connectedNodeIds: ["F", "G", "H", "J"],
    },
    {
      netId: "net_8",
      connectedNodeIds: ["I"],
    },
  ])
})
