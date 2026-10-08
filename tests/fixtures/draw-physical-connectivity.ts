import type {
  PhysicalConnectivityInput,
  PhysicalConnectivityPoint,
  PhysicalConnectivitySnapshot,
} from "../../src"

const colors = ["#2563eb", "#c2410c"]
const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
const text = (
  x: number,
  y: number,
  value: string,
  size = 16,
  color = "#334155",
) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${escape(value)}</text>`

// A small top-layer renderer for these fixtures. Component colors and labels
// come from the capture result, so the image also records the measured topology.
export function drawPhysicalConnectivity({
  input,
  snapshot,
  title,
  note,
  scale,
  center,
  labelOffsets = {},
}: {
  input: PhysicalConnectivityInput
  snapshot: PhysicalConnectivitySnapshot
  title: string
  note: string
  scale: number
  center: PhysicalConnectivityPoint
  labelOffsets?: Record<string, [number, number]>
}): string {
  const xy = (point: PhysicalConnectivityPoint) => ({
    x: 260 + (point.x - center.x) * scale,
    y: 245 - (point.y - center.y) * scale,
  })
  const color = (key: string) =>
    colors[
      snapshot.endpointComponents.findIndex((group) => group.includes(key))
    ]
  const colorAt = (point: PhysicalConnectivityPoint) => {
    const endpoint = input.endpoints.find(
      (endpoint) =>
        endpoint.point.x === point.x && endpoint.point.y === point.y,
    )
    if (!endpoint) throw new Error("Fixture copper must start at a terminal")
    return color(endpoint.endpointKey)
  }
  const pads = input.obstacles.map((pad) => {
    const { x, y } = xy(pad.center)
    const width = pad.width * scale
    const height = pad.height * scale
    const bounds = `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}"`
    if (pad.type === "oval") {
      return `${bounds} fill="none" stroke="#94a3b8" stroke-dasharray="6 5"/>
        <circle cx="${x}" cy="${y}" r="${width / 2}" fill="${colorAt(pad.center)}" fill-opacity="0.2" stroke="${colorAt(pad.center)}" stroke-width="2"/>`
    }
    return `${bounds} fill="${colorAt(pad.center)}" fill-opacity="0.2" stroke="${colorAt(pad.center)}" stroke-width="2"/>`
  })
  const traces = input.traces.flatMap((trace) => {
    const wires = trace.route.filter((point) => point.route_type === "wire")
    const jumper = trace.route.find((point) => point.route_type === "jumper")
    return wires.slice(1).map((end, index) => {
      const start = wires[index]
      const a = xy(start)
      const b = xy(end)
      const line = `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${colorAt(wires[0])}" stroke-width="${start.width * scale}" stroke-linecap="${jumper ? "butt" : "round"}"`
      if (!jumper) return `${line}/>`
      return `<rect x="${Math.min(a.x, b.x) + 0.4 * scale}" y="${a.y - 0.3 * scale}" width="${Math.abs(b.x - a.x) - 0.8 * scale}" height="${0.6 * scale}" fill="#e2e8f0" fill-opacity="0.65" stroke="#64748b"/>
        ${line} stroke-dasharray="8 7"/>`
    })
  })
  const terminals = input.endpoints.map((endpoint) => {
    const { x, y } = xy(endpoint.point)
    const [dx, dy] = labelOffsets[endpoint.endpointKey] ?? [10, -10]
    return `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${color(endpoint.endpointKey)}" stroke-width="2"/>
      ${text(x + dx, y + dy, endpoint.endpointLabel ?? endpoint.endpointKey, 17, color(endpoint.endpointKey))}`
  })
  const groups = snapshot.endpointComponents.map((group, index) =>
    text(
      24,
      423 + index * 27,
      `Component ${index + 1}: ${group.map((key) => snapshot.endpointLabels[key]).join(" + ")}`,
      17,
      colors[index],
    ),
  )
  return `<rect width="520" height="480" rx="12" fill="#f8fafc" stroke="#cbd5e1"/>
    ${text(24, 34, title, 21, "#0f172a")}
    ${text(24, 61, note, 15)}
    ${pads.join("\n")}
    ${traces.join("\n")}
    ${terminals.join("\n")}
    ${groups.join("\n")}`
}

export function physicalConnectivitySvg(
  title: string,
  description: string,
  panels: [string, string],
  legend: string,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="660" viewBox="0 0 1120 660">
  <rect width="1120" height="660" fill="white"/>
  <g font-family="sans-serif">
    ${text(24, 39, title, 27, "#0f172a")}
    ${text(24, 73, description, 17)}
    <g transform="translate(24 100)">${panels[0]}</g>
    <g transform="translate(576 100)">${panels[1]}</g>
    ${text(24, 614, legend, 16)}
    ${text(24, 641, "Colors show captured physical components. Every terminal has the same intended net name (NET).", 15)}
  </g>
</svg>`
}
