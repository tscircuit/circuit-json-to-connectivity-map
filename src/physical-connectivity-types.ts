export type PhysicalConnectivityPoint = { x: number; y: number }

export type PhysicalConnectivityWire = PhysicalConnectivityPoint & {
  route_type: "wire"
  width: number
  layer: string
}

export type PhysicalConnectivityVia = PhysicalConnectivityPoint & {
  route_type: "via"
  from_layer: string
  to_layer: string
  via_diameter?: number
}

export type PhysicalConnectivityTrace = {
  pcb_trace_id: string
  /** Already resolved electrical net. IDs and net names are opaque strings. */
  netName: string
  route: Array<
    | PhysicalConnectivityWire
    | PhysicalConnectivityVia
    | {
        route_type: "jumper"
        start: PhysicalConnectivityPoint
        end: PhysicalConnectivityPoint
        footprint: "0603" | "1206" | "1206x4_pair"
        layer: string
      }
    | {
        route_type: "through_obstacle"
        start: PhysicalConnectivityPoint
        end: PhysicalConnectivityPoint
        from_layer: string
        to_layer: string
        width: number
      }
  >
}

export type PhysicalConnectivityObstacleShape = {
  obstacleId?: string
  type: "rect" | "oval"
  shape?: "circle"
  center: PhysicalConnectivityPoint
  width: number
  height: number
  ccwRotationDegrees?: number
  layers: string[]
}

export type PhysicalConnectivityObstacle = PhysicalConnectivityObstacleShape & {
  /** Resolved net memberships, rather than aliases or ID-derived types. */
  netNames: string[]
}

export type PhysicalConnectivityEndpoint = {
  /** Unique, stable key used to compare terminal partitions across revisions. */
  endpointKey: string
  endpointLabel?: string
  point: PhysicalConnectivityPoint
  layers: string[]
  netName: string
}

export type PhysicalConnectivityInput = {
  layerCount: number
  defaultViaDiameter: number
  endpoints: PhysicalConnectivityEndpoint[]
  obstacles: PhysicalConnectivityObstacle[]
  /** Include any fixed copper as ordinary traces when capturing connectivity. */
  traces: PhysicalConnectivityTrace[]
}

export type PhysicalConnectivitySnapshot = {
  endpointCount: number
  endpointLabels: Record<string, string>
  componentByEndpointKey: Record<string, string>
  endpointComponents: string[][]
}
