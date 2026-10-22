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
- Find physically connected copper-pour components

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

### `getCopperConductorComponents(circuitJson, generatedStitchingViaIds?)`

Returns groups of physically touching, same-net copper conductors associated
with poured nets. SMT pads, plated holes, trace segments, and vias can connect
pours and terminals. Logical net membership alone does not connect separated
copper, and copper on different layers requires a plated bridge.

```typescript
import { getCopperConductorComponents } from "circuit-json-to-connectivity-map"

const connectedTerminalGroups = getCopperConductorComponents(circuitJson)
  .filter((conductors) => conductors.some((conductor) => conductor.pourId))
  .map((conductors) => [
    ...new Set(conductors.flatMap((conductor) => conductor.pcbPortIds ?? [])),
  ])
  .filter((pcbPortIds) => pcbPortIds.length > 1)
```

Each conductor exposes its net, layers, terminal status, and available pour,
via, and PCB port IDs. A generated stitching via still conducts copper, but
passing its ID in `generatedStitchingViaIds` prevents it from counting as an
authored terminal when finding floating copper. Callers must remove traces and
vias that will be discarded before requesting fresh-routing connectivity.

Geometry uses circuit-world points in millimeters: +X right, +Y up, and +Z
toward the top PCB layer. Returned Flatten polygons use the same right-handed
frame scaled by `1e6` for robust contact predicates; they are not millimeter
coordinates. Unassigned pours are ignored, and inputs without pours return `[]`.

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
