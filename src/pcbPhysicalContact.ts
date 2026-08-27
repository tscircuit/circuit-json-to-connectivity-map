import { computeGapBetweenCopper } from "@tscircuit/circuit-json-util/compute-gap-between-copper"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type {
  LayerRef,
  PcbCopperPour,
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  PcbTrace,
  PcbTraceRoutePointWire,
  PcbVia,
} from "circuit-json"

export type PcbPad = PcbSmtPad | PcbPlatedHole
export type SupportedCopperPour = Extract<
  PcbCopperPour,
  { shape: "rect" | "polygon" }
>
export type PhysicalCopperTarget = PcbPad | PcbVia | SupportedCopperPour

type WireSegment = {
  start: PcbTraceRoutePointWire
  end: PcbTraceRoutePointWire
}

const physicalContactToleranceMm = 1e-9

const getLayers = (target: PhysicalCopperTarget): LayerRef[] => {
  if (target.type === "pcb_smtpad") return [target.layer]
  if (target.type === "pcb_copper_pour") return [target.layer]
  return target.layers
}

const getWireSegments = (trace: PcbTrace): WireSegment[] => {
  const segments: WireSegment[] = []
  for (let index = 0; index < trace.route.length - 1; index++) {
    const start = trace.route[index]
    const end = trace.route[index + 1]
    if (start?.route_type !== "wire" || end?.route_type !== "wire") continue
    if (start.layer !== end.layer) continue
    segments.push({ start, end })
  }
  return segments
}

const getSegmentTrace = ({ start, end }: WireSegment): PcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: "physical_segment",
  route: [start, end],
})

export const doesTraceTouchCopperTarget = ({
  trace,
  target,
}: {
  trace: PcbTrace
  target: PhysicalCopperTarget
}): boolean => {
  const targetLayers = getLayers(target)
  return getWireSegments(trace).some(
    (segment) =>
      targetLayers.includes(segment.start.layer) &&
      computeGapBetweenCopper(getSegmentTrace(segment), target) <=
        physicalContactToleranceMm,
  )
}

export const doesPortTouchTrace = ({
  port,
  trace,
}: {
  port: PcbPort
  trace: PcbTrace
}): boolean =>
  getWireSegments(trace).some(
    (segment) =>
      port.layers.includes(segment.start.layer) &&
      pointToSegmentDistance(port, segment.start, segment.end) <=
        segment.start.width / 2 + physicalContactToleranceMm,
  )

export const doCopperTargetsTouch = (
  first: PhysicalCopperTarget,
  second: PhysicalCopperTarget,
): boolean =>
  getLayers(first).some((layer) => getLayers(second).includes(layer)) &&
  computeGapBetweenCopper(first, second) <= physicalContactToleranceMm

export const doesPortTouchVia = (port: PcbPort, via: PcbVia): boolean =>
  port.layers.some((layer) => via.layers.includes(layer)) &&
  Math.hypot(port.x - via.x, port.y - via.y) <=
    via.outer_diameter / 2 + physicalContactToleranceMm
