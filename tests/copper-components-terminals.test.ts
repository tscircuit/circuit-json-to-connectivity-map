import { expect, test } from "bun:test"
import {
  getCopperConductorComponents,
  getFullConnectivityMapFromCircuitJson,
} from "../src"
import {
  getPourPortIds,
  makeCopperPourCircuit,
} from "./fixtures/copper-pour-circuit"

test("physical pour connectivity does not join an outside terminal on the same net", () => {
  const circuitJson = makeCopperPourCircuit()
  const original = structuredClone(circuitJson)
  expect(
    getFullConnectivityMapFromCircuitJson(circuitJson).areAllIdsConnected([
      "port_0",
      "port_1",
      "port_2",
    ]),
  ).toBe(true)
  expect(getPourPortIds(getCopperConductorComponents(circuitJson))).toEqual([
    "port_0",
    "port_1",
  ])
  expect(circuitJson).toEqual(original)
  expect(
    getCopperConductorComponents(
      circuitJson.filter((e) => e.type !== "pcb_copper_pour"),
    ),
  ).toEqual([])
})
