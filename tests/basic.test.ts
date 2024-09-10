import { test, expect } from "bun:test";

test("should create basic connectivity map", () => {
	// Example usage
	const connections: Array<NodeId[]> = [
		["A", "B"],
		["B", "C"],
		["D", "E"],
		["F", "G", "H"],
		["I"],
		["G", "J"],
	];

	const result = findConnectedNetworks(connections);
	console.log(result);
});
