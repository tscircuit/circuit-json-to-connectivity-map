import { test, expect } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("ConnectivityMap.addConnections should add new connections correctly", () => {
  const initialNetMap = {
    net1: ["A", "B"],
    net2: ["C", "D"],
  }

  const connectivityMap = new ConnectivityMap(initialNetMap)

  connectivityMap.addConnections([
    ["B", "E"],
    ["F", "G"],
    ["C", "H"],
  ])

  expect(connectivityMap.areIdsConnected("A", "E")).toBe(true)
  expect(connectivityMap.areIdsConnected("C", "H")).toBe(true)
  expect(connectivityMap.areIdsConnected("F", "G")).toBe(true)
  expect(connectivityMap.areIdsConnected("A", "C")).toBe(false)
  expect(connectivityMap.areIdsConnected("E", "F")).toBe(false)

  const allConnectedToNet1 = connectivityMap.getIdsConnectedToNet("net1")
  expect(allConnectedToNet1.sort()).toEqual(["A", "B", "E"])

  const fNetId = connectivityMap.getNetConnectedToId("F")
  const allConnectedToF = connectivityMap.getIdsConnectedToNet(fNetId!)
  expect(allConnectedToF.sort()).toEqual(["F", "G"])
})
