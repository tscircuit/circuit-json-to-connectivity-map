import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("addConnections does not clobber existing net when net keys have gaps", () => {
  const cm = new ConnectivityMap({ connectivity_net1: ["A", "B"] })
  cm.addConnections([["X", "Y"]])

  expect(cm.areIdsConnected("A", "X")).toBe(false)
  expect(cm.getIdsConnectedToNet("connectivity_net1")).toEqual(["A", "B"])
})
