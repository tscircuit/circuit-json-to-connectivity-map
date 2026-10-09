import type { Box, Point } from "@tscircuit/math-utils"
import type {
  PcbTraceRoutePointVia,
  PcbTraceRoutePointWire,
} from "circuit-json"

/** Normalized constant-width copper; layer names come from the caller. */
export type PhysicalConnectivityWire = Pick<
  PcbTraceRoutePointWire,
  "route_type" | "x" | "y" | "width"
> & { layer: string }

export type PhysicalConnectivityVia = Pick<
  PcbTraceRoutePointVia,
  "route_type" | "x" | "y"
> & {
  from_layer: string
  to_layer: string
  via_diameter?: number
  /** Actual conductive layer span, supplied by the caller's drill policy. */
  layers: string[]
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
        start: Point
        end: Point
        /** Descriptive metadata only; pad geometry comes from obstacles. */
        footprint?: string
        layer: string
      }
    | {
        route_type: "through_obstacle"
        start: Point
        end: Point
        from_layer: string
        to_layer: string
        width: number
      }
  >
}

export type PhysicalConnectivityObstacle = Box & {
  obstacleId?: string
  type: "rect" | "oval"
  shape?: "circle"
  ccwRotationDegrees?: number
  layers: string[]
  /** Electrically continuous copper with already resolved net memberships. */
  netNames: string[]
}

export type PhysicalConnectivityEndpoint = {
  /** Unique, stable key used to compare terminal partitions across revisions. */
  endpointKey: string
  endpointLabel?: string
  point: Point
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

export type PhysicalConnectivitySplit = {
  baselineEndpointKeys: string[]
  baselineEndpointLabels: string[]
  candidateComponents: string[][]
}
