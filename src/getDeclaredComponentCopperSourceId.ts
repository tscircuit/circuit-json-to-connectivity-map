import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  PcbPort,
  PcbTrace,
  PcbTraceRoutePoint,
  PcbVia,
} from "circuit-json"
import { ConnectivityMap } from "./ConnectivityMap"
import { findConnectedNetworks } from "./findConnectedNetworks"

function getSourcePort(
  db: CircuitJsonUtilObjects,
  pcbPortId: PcbPort["pcb_port_id"],
) {
  const pcbPort = db.pcb_port.get(pcbPortId)
  if (!pcbPort) return undefined
  return db.source_port.get(pcbPort.source_port_id)
}

function getRoutePointPcbPortIds(
  point: PcbTraceRoutePoint,
  db: CircuitJsonUtilObjects,
): string[] {
  if (point.route_type === "wire") {
    return [point.start_pcb_port_id, point.end_pcb_port_id].filter(
      (id): id is string => Boolean(id),
    )
  }
  if (point.route_type === "through_pad") {
    const smtPadPortId = point.pcb_smtpad_id
      ? db.pcb_smtpad.get(point.pcb_smtpad_id)?.pcb_port_id
      : undefined
    const platedHolePortId = point.pcb_plated_hole_id
      ? db.pcb_plated_hole.get(point.pcb_plated_hole_id)?.pcb_port_id
      : undefined
    return [smtPadPortId, platedHolePortId].filter((id): id is string =>
      Boolean(id),
    )
  }
  return []
}

/** Attach component copper only to an existing declared internal connection. */
export function getDeclaredComponentCopperSourceId(
  copper: PcbTrace | PcbVia,
  db: CircuitJsonUtilObjects,
) {
  const pcbPortIds =
    copper.type === "pcb_via"
      ? (copper.pcb_port_ids ?? [])
      : copper.route.flatMap((point) => getRoutePointPcbPortIds(point, db))
  const distinctPcbPortIds = [...new Set(pcbPortIds)]
  if (distinctPcbPortIds.length < 2) return undefined
  const sourcePorts = distinctPcbPortIds.map((id) => getSourcePort(db, id))
  if (sourcePorts.some((port) => !port)) return undefined
  const sourcePortIds = sourcePorts.flatMap((port) =>
    port ? [port.source_port_id] : [],
  )
  const sourceComponentId = sourcePorts[0]?.source_component_id
  if (
    !sourceComponentId ||
    sourcePorts.some((port) => port?.source_component_id !== sourceComponentId)
  )
    return undefined

  if (copper.type === "pcb_via") {
    return db.source_manually_placed_via.get(sourceComponentId)
      ?.source_manually_placed_via_id
  }

  if (!copper.pcb_component_id) return undefined
  const pcbComponent = db.pcb_component.get(copper.pcb_component_id)
  if (pcbComponent?.source_component_id !== sourceComponentId) return undefined

  const internalConnections = db.source_component_internal_connection.list({
    source_component_id: sourceComponentId,
  })
  const directConnection = internalConnections.find((connection) =>
    sourcePortIds.every((portId) =>
      connection.source_port_ids.includes(portId),
    ),
  )
  if (directConnection) {
    return directConnection.source_component_internal_connection_id
  }

  const sourceComponent = db.source_component.get(sourceComponentId)
  const declaredPortGroups = [
    ...internalConnections
      .filter((connection) => connection.source_port_ids.length >= 2)
      .map((connection) => [
        connection.source_component_internal_connection_id,
        ...connection.source_port_ids,
      ]),
    ...(sourceComponent?.internally_connected_source_port_ids ?? []).filter(
      (portGroup) => portGroup.length >= 2,
    ),
  ]
  if (declaredPortGroups.length === 0) return undefined

  const internalMap = new ConnectivityMap(
    findConnectedNetworks(declaredPortGroups),
  )
  if (!internalMap.areAllIdsConnected(sourcePortIds)) return undefined

  const matchingInternalConnection = internalConnections.find((connection) =>
    internalMap.areIdsConnected(
      connection.source_component_internal_connection_id,
      sourcePortIds[0]!,
    ),
  )
  return (
    matchingInternalConnection?.source_component_internal_connection_id ??
    sourcePortIds[0]
  )
}
