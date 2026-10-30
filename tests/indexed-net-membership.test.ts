import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"
import { OriginalConnectivityMap } from "./fixtures/OriginalConnectivityMap"

test("indexed insertion preserves members, aliases and merge order", () => {
  const cases: Record<string, string[]>[] = [
    {},
    { first: ["a", "b"], second: ["b", "c"] },
  ]
  for (const initial of cases) {
    const actual = new ConnectivityMap(structuredClone(initial))
    const original = new OriginalConnectivityMap(structuredClone(initial))
    let state = 71345
    for (let step = 0; step < 2000; step++) {
      const connection: string[] = []
      for (let i = 0; i < step % 7; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        connection.push(`id${state % 600}`)
      }
      actual.addConnections([connection])
      original.addConnections([connection])
      expect(actual.netMap).toEqual(original.netMap)
      expect(actual.idToNetMap).toEqual(original.idToNetMap)
    }
  }
})
