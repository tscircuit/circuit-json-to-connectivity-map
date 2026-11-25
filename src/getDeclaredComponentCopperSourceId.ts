import type {
  AnyCircuitElement,
  PcbPort,
  PcbTrace,
  PcbVia,
  SourcePort,
} from "circuit-json"

function getSourcePort(
  circuitJson: AnyCircuitElement[],
  pcbPortId: PcbPort["pcb_port_id"],
) {
  const pcbPort = circuitJson.find(
    (port) => port.type === "pcb_port" && port.pcb_port_id === pcbPortId,
  )
  if (pcbPort?.type !== "pcb_port") return undefined
  return circuitJson.find(
    (port): port is SourcePort =>
      port.type === "source_port" &&
      port.source_port_id === pcbPort.source_port_id,
  )
}

/** Attach component copper only to an existing declared internal connection. */
export function getDeclaredComponentCopperSourceId(
  circuitJson: AnyCircuitElement[],
  copper: PcbTrace | PcbVia,
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
  if (pcbPortIds.length < 2) return undefined
  const sourcePorts = pcbPortIds.map((id) => getSourcePort(circuitJson, id))
  if (sourcePorts.some((port) => !port)) return undefined
  const sourceComponentId = sourcePorts[0]?.source_component_id
  if (
    !sourceComponentId ||
    sourcePorts.some((port) => port?.source_component_id !== sourceComponentId)
  )
    return undefined

  if (copper.type === "pcb_via") {
    const sourceVia = circuitJson.find(
      (via) =>
        via.type === "source_manually_placed_via" &&
        via.source_manually_placed_via_id === sourceComponentId,
    )
    if (sourceVia?.type === "source_manually_placed_via")
      return sourceVia.source_manually_placed_via_id
    return undefined
  }

  const pcbComponent = circuitJson.find(
    (component) =>
      component.type === "pcb_component" &&
      component.pcb_component_id === copper.pcb_component_id &&
      component.source_component_id === sourceComponentId,
  )
  if (!pcbComponent) return undefined
  const internalConnection = circuitJson.find(
    (connection) =>
      connection.type === "source_component_internal_connection" &&
      connection.source_component_id === sourceComponentId &&
      sourcePorts.every(
        (port) =>
          port && connection.source_port_ids.includes(port.source_port_id),
      ),
  )
  if (internalConnection?.type === "source_component_internal_connection")
    return internalConnection.source_component_internal_connection_id
  return undefined
}
