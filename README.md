# Circuit JSON to Connectivity Map

This project provides utilities to generate connectivity maps from circuit JSON data. It's designed to work with the `@tscircuit/soup` library and offers functionality to find connected networks and create source port connectivity maps.

## Features

- Find connected networks from a list of connections
- Generate source port connectivity maps from circuit JSON data

## Installation

To install dependencies:

```bash
bun install
```

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
```

### Generating Source Port Connectivity Map

```typescript
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { AnySoupElement } from "@tscircuit/soup"

const circuitJson: AnySoupElement[] = [
  // Your circuit JSON data here
]

const connectivityMap = getSourcePortConnectivityMapFromCircuitJson(circuitJson)
console.log(connectivityMap)
```

### Generating Full Connectivity Map

```typescript
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { AnySoupElement } from "@tscircuit/soup"

const circuitJson: AnySoupElement[] = [
  // Your circuit JSON data here
]

const fullConnectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
console.log(fullConnectivityMap)
```

## Running Tests

To run the tests:

```bash
bun test
```

This will run all tests, including the newly added test for `getFullConnectivityMapFromCircuitJson`.

## Development

This project uses [Bun](https://bun.sh) as its JavaScript runtime. Bun is a fast all-in-one JavaScript runtime.

To start development:

1. Clone the repository
2. Run `bun install` to install dependencies
3. Make your changes
4. Run `bun test` to ensure all tests pass

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
