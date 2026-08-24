import type { PCBTrace } from "circuit-json"

export const makeStraightPcbTrace = (
  pcbTraceId: string,
  layer: "top" | "bottom",
  start: { x: number; y: number },
  end: { x: number; y: number },
): PCBTrace => ({
  type: "pcb_trace",
  pcb_trace_id: pcbTraceId,
  route: [
    { ...start, route_type: "wire", width: 0.2, layer },
    { ...end, route_type: "wire", width: 0.2, layer },
  ],
})
