import { test, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "../src"
import type { AnyCircuitElement } from "circuit-json"

// getFullConnectivityMapFromCircuitJson has a branch for the older
// source_component.internally_connected_source_port_ids but none for the
// source_component_internal_connection element, so internally-connected ports
// come back disconnected here even though
// getSourcePortConnectivityMapFromCircuitJson honors them.
test("getFullConnectivityMapFromCircuitJson honors source_component_internal_connection", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "internal_connection_1",
      source_component_id: "source_component_1",
      source_port_ids: ["source_port_1", "source_port_2"],
    },
  ]

  const fullMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  expect(fullMap.areIdsConnected("source_port_1", "source_port_2")).toBe(true)
})
