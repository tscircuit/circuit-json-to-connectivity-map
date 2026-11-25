import type { AnyCircuitElement } from "circuit-json"
import { cjuIndexed } from "@tscircuit/circuit-json-util"
import { ConnectivityMap } from "./ConnectivityMap"
import { findConnectedNetworks } from "./findConnectedNetworks"
import { getDeclaredComponentCopperSourceId } from "./getDeclaredComponentCopperSourceId"

/**
 * Desired connectivity comes from source declarations. PCB objects are aliases
 * of their declared owners. PCB endpoints never join intended source nets.
 */
export const getFullConnectivityMapFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
) => {
  const connections: string[][] = []
  const db = cjuIndexed([...circuitJson], {
    indexConfig: { byId: true, byType: true },
  })

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
        connections.push([
          element.source_component_internal_connection_id,
          ...element.source_port_ids,
        ])
        break
      case "source_manually_placed_via": {
        const sourcePortIds = db.source_port
          .list({ source_component_id: element.source_manually_placed_via_id })
          .map((port) => port.source_port_id)
        connections.push(
          [
            element.source_manually_placed_via_id,
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
      case "pcb_trace": {
        const sourceOwnerId =
          element.source_trace_id ??
          getDeclaredComponentCopperSourceId(element, db)
        if (sourceOwnerId)
          connections.push([element.pcb_trace_id, sourceOwnerId])
        break
      }
      case "pcb_via": {
        const sourceOwnerId =
          element.source_trace_id ??
          element.source_net_id ??
          element.pcb_trace_id ??
          getDeclaredComponentCopperSourceId(element, db)
        if (sourceOwnerId) connections.push([element.pcb_via_id, sourceOwnerId])
        break
      }
    }
  }

  return new ConnectivityMap(findConnectedNetworks(connections))
}
