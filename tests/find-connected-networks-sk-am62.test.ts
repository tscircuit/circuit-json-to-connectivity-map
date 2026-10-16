import { expect, test } from "bun:test"
import { findConnectedNetworks } from "../src/findConnectedNetworks"
import skAm62ConnectivityFixture from "./assets/sk-am62-connectivity-connections.json"

test("builds the connectivity networks extracted from the SK-AM62 board", () => {
  const networks = findConnectedNetworks(skAm62ConnectivityFixture.connections)

  expect(skAm62ConnectivityFixture.connections).toHaveLength(5_000)
  expect(Object.keys(networks)).toHaveLength(4_907)
  expect(networks.connectivity_net14314).toEqual([
    "pcb_smtpad_3821",
    "pcb_port_3939",
  ])
  expect(networks.connectivity_net2797).toContain("source_port_1302")
})
