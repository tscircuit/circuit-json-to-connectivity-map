import { expect, test } from "bun:test"
import { findConnectedNetworks } from "../src/findConnectedNetworks"

const independentNetCount = 8_000

test("keeps a Sitara-scale set of independent nets separate", () => {
  const connections = Array.from(
    { length: independentNetCount },
    (_, netIndex) => [
      `source_trace_${netIndex}`,
      `source_port_${netIndex}_a`,
      `source_port_${netIndex}_b`,
    ],
  )

  const networks = findConnectedNetworks(connections)

  expect(Object.keys(networks)).toHaveLength(independentNetCount)
  expect(networks.connectivity_net0).toEqual([
    "source_trace_0",
    "source_port_0_a",
    "source_port_0_b",
  ])
})
