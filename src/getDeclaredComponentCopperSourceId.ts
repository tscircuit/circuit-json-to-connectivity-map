import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbPort, PcbTrace, PcbVia } from "circuit-json"

function getSourcePort(
  db: CircuitJsonUtilObjects,
  pcbPortId: PcbPort["pcb_port_id"],
) {
  const pcbPort = db.pcb_port.get(pcbPortId)
  if (!pcbPort) return undefined
  return db.source_port.get(pcbPort.source_port_id)
}

/** Attach component copper only to an existing declared internal connection. */
export function getDeclaredComponentCopperSourceId(
  copper: PcbTrace | PcbVia,
  db: CircuitJsonUtilObjects,
) {
  const pcbPortIds =
    copper.type === "pcb_via"
      ? (copper.pcb_port_ids ?? [])
      : copper.route.flatMap((point) =>
          point.route_type === "wire"
            ? [point.start_pcb_port_id, point.end_pcb_port_id].filter(
                (id): id is string => Boolean(id),
              )
            : [],
        )
  const distinctPcbPortIds = [...new Set(pcbPortIds)]
  if (distinctPcbPortIds.length < 2) return undefined
  const sourcePorts = distinctPcbPortIds.map((id) => getSourcePort(db, id))
  if (sourcePorts.some((port) => !port)) return undefined
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
  const internalConnection = db.source_component_internal_connection
    .list({ source_component_id: sourceComponentId })
    .find((connection) =>
      sourcePorts.every(
        (port) =>
          port && connection.source_port_ids.includes(port.source_port_id),
      ),
    )
  return internalConnection?.source_component_internal_connection_id
}
