import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("canonical net ids compare as connected to their T113 trace members", () => {
  const connMap = new ConnectivityMap({
    connectivity_net57: ["source_trace_44", "source_port_140"],
    connectivity_net133: ["source_trace_224", "source_port_369"],
  })
  const routeNetId = connMap.getNetConnectedToId("source_trace_44")!

  expect(routeNetId).toBe("connectivity_net57")
  expect(connMap.areIdsConnected(routeNetId, "source_trace_44")).toBe(true)
  expect(connMap.areIdsConnected("source_trace_44", routeNetId)).toBe(true)
  expect(connMap.areIdsConnected(routeNetId, "source_trace_224")).toBe(false)
  expect(
    connMap.areAllIdsConnected([
      routeNetId,
      "source_trace_44",
      "source_port_140",
    ]),
  ).toBe(true)

  connMap.addConnections([["source_trace_44", "source_trace_224"]])

  expect(
    connMap.areIdsConnected("connectivity_net133", "source_trace_44"),
  ).toBe(true)
})
