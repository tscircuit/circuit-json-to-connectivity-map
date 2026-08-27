declare module "@tscircuit/circuit-json-util/compute-gap-between-copper" {
  type CircuitElement = import("circuit-json").AnyCircuitElement

  export const computeGapBetweenCopper: (
    first: CircuitElement,
    second: CircuitElement,
  ) => number
}
