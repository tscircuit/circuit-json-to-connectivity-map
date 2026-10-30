import { createHash } from "node:crypto"
import { ConnectivityMap } from "../src/ConnectivityMap"
import { OriginalConnectivityMap } from "../tests/fixtures/OriginalConnectivityMap"

// A large shared power net is encountered again for each imported copper item.
const members = Array.from({ length: 4096 }, (_, i) => `port_${i}`)
const connections = Array.from({ length: 128 }, (_, i) => [
  `obstacle_${i}`,
  ...members,
])
for (const Constructor of [
  OriginalConnectivityMap,
  ConnectivityMap,
  ConnectivityMap,
  OriginalConnectivityMap,
]) {
  const start = performance.now()
  const map = new Constructor({})
  map.addConnections(connections)
  const elapsedMs = performance.now() - start
  console.log({
    implementation: Constructor.name,
    elapsedMs,
    outputHash: createHash("sha256")
      .update(JSON.stringify([map.netMap, map.idToNetMap]))
      .digest("hex"),
  })
}
