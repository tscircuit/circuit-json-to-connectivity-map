import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

for (const id of ["__proto__", "constructor", "toString"]) {
  test(`unknown ${id} is not an inherited net or element`, () => {
    const map = new ConnectivityMap({})
    expect(map.getNetConnectedToId(id)).toBeUndefined()
    expect(map.getIdsConnectedToNet(id)).toEqual([])
    expect(map.areAllIdsConnected([id])).toBe(false)
  })

  test(`constructor indexes the literal ${id} element`, () => {
    const map = new ConnectivityMap({ net_a: [id, "peer"] })
    expect(map.getNetConnectedToId(id)).toBe("net_a")
    expect(map.areAllIdsConnected([id, "peer"])).toBe(true)
    map.addConnections([[id, "later"]])
    expect(map.areAllIdsConnected([id, "peer", "later"])).toBe(true)
  })

  test(`addConnections can create and merge the literal ${id} element`, () => {
    const map = new ConnectivityMap({ existing: ["other"] })
    map.addConnections([[id, "peer"]])
    expect(map.areIdsConnected(id, "peer")).toBe(true)
    expect(map.areIdsConnected(id, "other")).toBe(false)
    map.addConnections([["other", id]])
    expect(map.areAllIdsConnected(["other", id, "peer"])).toBe(true)
  })

  test(`an own ${id} net remains accessible through a merge`, () => {
    const nets = { [id]: ["first"], regular: ["second"] }
    const map = new ConnectivityMap(nets)
    map.addConnections([["second", "first"]])
    expect(map.getIdsConnectedToNet(id)).toBe(
      map.getIdsConnectedToNet("regular"),
    )
    expect(map.getIdsConnectedToNet(id)).toEqual(["second", "first"])
    expect(map.netMap).toBe(nets)
    expect(Object.getPrototypeOf(nets)).toBe(Object.prototype)
  })
}
