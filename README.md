# Circuit JSON to Connectivity Map

This library provides utilities to generate connectivity maps from circuit JSON data. It's designed to work with the `@tscircuit/soup` library and offers functionality to find connected networks and create connectivity maps.

## Installation

To install the library, use npm or bun:

```bash
npm add circuit-json-to-connectivity-map
```

## Features

- Find connected networks from a list of connections
- Generate source port connectivity maps from circuit JSON data
- Generate full connectivity maps from circuit JSON data

## Usage

### Finding Connected Networks

```typescript
import { findConnectedNetworks } from "circuit-json-to-connectivity-map"

const connections = [
  ["A", "B"],
  ["B", "C"],
  ["D", "E"],
]

const result = findConnectedNetworks(connections)
console.log(result)

// Output:
// {
//   connectivity_net0: ["A", "B", "C"],
//   connectivity_net3: ["D", "E"],
// }
```

### Generating Source Port Connectivity Map

```typescript
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"

const circuitJson: AnyCircuitElement[] = [
  // Your circuit JSON data here
]

const connectivityMap = getSourcePortConnectivityMapFromCircuitJson(circuitJson)

// Check if two IDs are connected
console.log(connectivityMap.areIdsConnected("port1", "port2"))

// Get all IDs connected to a specific net
console.log(connectivityMap.getIdsConnectedToNet("net1"))

// Get the net connected to a specific ID
console.log(connectivityMap.getNetConnectedToId("port1"))
```

### Generating Full Connectivity Map

```typescript
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"

const circuitJson: AnyCircuitElement[] = [
  // Your circuit JSON data here
]

const fullConnectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

// Check if two IDs are connected (including PCB elements)
console.log(fullConnectivityMap.areIdsConnected("smtpad1", "port1"))

// Get all IDs connected to a specific net
console.log(fullConnectivityMap.getIdsConnectedToNet("net1"))

// Get the net connected to a specific ID
console.log(fullConnectivityMap.getNetConnectedToId("pcb_port1"))
```

## API Reference

### `findConnectedNetworks(connections: Array<string[]>): Record<string, string[]>`

Finds connected networks from a list of connections.

### `getSourcePortConnectivityMapFromCircuitJson(circuitJson: AnyCircuitElement[]): ConnectivityMap`

Generates a source port connectivity map from circuit JSON data.

### `getFullConnectivityMapFromCircuitJson(circuitJson: AnyCircuitElement[]): ConnectivityMap`

Generates a full connectivity map from circuit JSON data, including PCB elements.

### `ConnectivityMap`

A class representing the connectivity map with methods:

- `areIdsConnected(id1: string, id2: string): boolean`
- `getIdsConnectedToNet(netId: string): string[]`
- `getNetConnectedToId(id: string): string | undefined`

## Capturing physical terminal connectivity

`capturePhysicalConnectivity` computes terminal components from actual copper
geometry. Supply already resolved net names; the function does not infer nets
from identifiers, aliases, or source connections. It also does not check shorts
between different nets.

```typescript
import { capturePhysicalConnectivity } from "circuit-json-to-connectivity-map"

const snapshot = capturePhysicalConnectivity({
  layerCount: 2,
  defaultViaDiameter: 0.6,
  endpoints: [
    { endpointKey: "A", point: { x: 0, y: 0 }, layers: ["top"], netName: "POWER" },
    { endpointKey: "B", point: { x: 2, y: 0 }, layers: ["top"], netName: "POWER" },
  ],
  obstacles: [],
  traces: [{
    pcb_trace_id: "route",
    netName: "POWER",
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "top" },
    ],
  }],
})
// snapshot.endpointComponents === [["A", "B"]]
```

Supported geometry includes rotated rectangular pads, circular pads, wire
segments, vias across their layer span, 0603/1206/1206x4_pair jumper pads, and
through-obstacle markers with a same-net multilayer copper witness. Segment width
comes from its first route point. Jumper placeholder wires do not become exposed
copper under the jumper body. Include fixed copper in `traces` as well.

Non-circular oval pads and malformed bridge/via geometry throw an error.
Callers own validation policy, revision comparison, and rollback. Stable, unique
`endpointKey` values let a caller detect components that split between snapshots;
counting connected terminals alone cannot detect a component swap.

## Development

This project uses [Bun](https://bun.sh) as its JavaScript runtime.

To start development:

1. Clone the repository
2. Run `bun install` to install dependencies
3. Make your changes
4. Run `bun test` to ensure all tests pass

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
