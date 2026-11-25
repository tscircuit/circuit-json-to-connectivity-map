import type { AnyCircuitElement } from "circuit-json"
import { ConnectivityMap } from "./ConnectivityMap"
import { findConnectedNetworks } from "./findConnectedNetworks"

/**
 * Desired connectivity comes from source declarations. PCB objects are aliases
 * of their declared owners; route endpoints and physical contact add no edges.
 */
export const getFullConnectivityMapFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
) => {
  const connections: string[][] = []

  for (const element of circuitJson) {
    switch (element.type) {
      case "source_trace":
        connections.push([
          element.source_trace_id,
          ...(element.connected_source_port_ids ?? []),
          ...(element.connected_source_net_ids ?? []),
        ])
        break
      case "source_port":
        connections.push([element.source_port_id])
        break
      case "source_net":
        connections.push([element.source_net_id])
        break
      case "source_component":
        connections.push(
          ...(element.internally_connected_source_port_ids ?? []),
        )
        break
      case "source_component_internal_connection":
        connections.push(element.source_port_ids)
        break
      case "source_manually_placed_via": {
        const sourcePortIds = circuitJson.flatMap((sourcePort) =>
          sourcePort.type === "source_port" &&
          sourcePort.source_component_id ===
            element.source_manually_placed_via_id
            ? [sourcePort.source_port_id]
            : [],
        )
        connections.push(
          [
            ...sourcePortIds,
            element.source_net_id,
            element.source_trace_id,
          ].filter((id): id is string => Boolean(id)),
        )
        break
      }
      case "pcb_port":
        if (element.source_port_id)
          connections.push([element.source_port_id, element.pcb_port_id])
        break
      case "pcb_smtpad":
        if (element.pcb_port_id)
          connections.push([element.pcb_smtpad_id, element.pcb_port_id])
        break
      case "pcb_plated_hole":
        if (element.pcb_port_id)
          connections.push([element.pcb_plated_hole_id, element.pcb_port_id])
        break
      case "pcb_trace":
        if (element.source_trace_id)
          connections.push([element.pcb_trace_id, element.source_trace_id])
        break
      case "pcb_via": {
        const sourceOwnerId =
          element.source_trace_id ??
          element.source_net_id ??
          element.pcb_trace_id
        if (sourceOwnerId) connections.push([element.pcb_via_id, sourceOwnerId])
        break
      }
    }
  }

  return new ConnectivityMap(findConnectedNetworks(connections))
}
