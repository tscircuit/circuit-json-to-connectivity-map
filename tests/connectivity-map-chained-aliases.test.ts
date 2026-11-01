import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

const members = (map: ConnectivityMap, netId: string) =>
  [...map.getIdsConnectedToNet(netId)].sort()

test("older net aliases stay current when their merged net is absorbed", () => {
  const map = new ConnectivityMap({
    first: ["A"],
    second: ["B"],
    third: ["C"],
    unrelated: ["X", "Y"],
  })
  map.addConnections([["A", "B"]])
  expect(members(map, "second")).toEqual(["A", "B"])

  map.addConnections([["C", "A"]])
  for (const netId of ["first", "second", "third"]) {
    expect(members(map, netId)).toEqual(["A", "B", "C"])
  }
  expect(map.areAllIdsConnected(["A", "B", "C"])).toBe(true)
  expect(members(map, "unrelated")).toEqual(["X", "Y"])
  expect(map.areIdsConnected("A", "X")).toBe(false)

  map.addConnections([["B", "D"]])
  for (const netId of ["first", "second", "third"]) {
    expect(members(map, netId)).toEqual(["A", "B", "C", "D"])
    expect(map.netMap[netId]).toBe(map.netMap.third)
  }
  expect(map.getNetConnectedToId("D")).toBe("third")
})

test("merging two groups of aliased nets preserves every historical net ID", () => {
  const map = new ConnectivityMap({
    a: ["A"],
    b: ["B"],
    c: ["C"],
    d: ["D"],
    e: ["E"],
  })
  map.addConnections([
    ["A", "B"],
    ["C", "D"],
    ["C", "A"],
    ["E", "B"],
  ])

  for (const netId of ["a", "b", "c", "d", "e"]) {
    expect(members(map, netId)).toEqual(["A", "B", "C", "D", "E"])
  }
  map.addConnections([
    ["D", "F"],
    ["A", "F"],
  ])
  for (const netId of ["a", "b", "c", "d", "e"]) {
    expect(members(map, netId)).toEqual(["A", "B", "C", "D", "E", "F"])
  }
  for (const id of ["A", "B", "C", "D", "E", "F"]) {
    expect(map.getNetConnectedToId(id)).toBe("e")
  }
})

test("aliases remain current when the original merged net stays the target", () => {
  const map = new ConnectivityMap({ a: ["A"], b: ["B"], c: ["C"] })
  map.addConnections([
    ["A", "B"],
    ["A", "C"],
    ["C", "D"],
  ])
  for (const netId of ["a", "b", "c"]) {
    expect(members(map, netId)).toEqual(["A", "B", "C", "D"])
  }
})
