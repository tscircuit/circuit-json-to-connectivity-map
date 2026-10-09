import { expect, test } from "bun:test"
import {
  findSplitPhysicalConnectivityComponents,
  type PhysicalConnectivitySnapshot,
} from "../src"

const snapshot = (groups: string[][]): PhysicalConnectivitySnapshot => {
  const endpointLabels: Record<string, string> = Object.create(null)
  const componentByEndpointKey: Record<string, string> = Object.create(null)
  for (const [index, group] of groups.entries()) {
    for (const key of group) {
      endpointLabels[key] = `Terminal ${key}`
      componentByEndpointKey[key] = `component-${index}`
    }
  }
  return {
    endpointCount: groups.flat().length,
    endpointLabels,
    componentByEndpointKey,
    endpointComponents: groups.map((group) => [...group]),
  }
}

test("reports terminal partition swaps even when connected counts stay equal", () => {
  const baseline = snapshot([
    ["A", "B"],
    ["C", "D"],
  ])
  const candidate = snapshot([
    ["A", "C"],
    ["B", "D"],
  ])

  expect(findSplitPhysicalConnectivityComponents(baseline, candidate)).toEqual([
    {
      baselineEndpointKeys: ["A", "B"],
      baselineEndpointLabels: ["Terminal A", "Terminal B"],
      candidateComponents: [["A"], ["B"]],
    },
    {
      baselineEndpointKeys: ["C", "D"],
      baselineEndpointLabels: ["Terminal C", "Terminal D"],
      candidateComponents: [["C"], ["D"]],
    },
  ])
})

test("allows unchanged or merged groups and ignores baseline single terminals", () => {
  const baseline = snapshot([["A", "B"], ["C", "D"], ["single"]])

  for (const groups of [
    [
      ["D", "C"],
      ["B", "A"],
    ],
    [["A", "B", "C", "D"]],
  ]) {
    expect(
      findSplitPhysicalConnectivityComponents(baseline, snapshot(groups)),
    ).toEqual([])
  }
})

test("missing terminals remain separate from each other and opaque component IDs", () => {
  const baseline = snapshot([["A", "B", "C"]])
  const remaining = snapshot([["B", "C"]])
  const opaqueId = snapshot([["B", "C"]])
  opaqueId.componentByEndpointKey.B = "missing:A"
  opaqueId.componentByEndpointKey.C = "missing:A"

  for (const candidate of [remaining, opaqueId]) {
    expect(
      findSplitPhysicalConnectivityComponents(baseline, candidate),
    ).toEqual([
      {
        baselineEndpointKeys: ["A", "B", "C"],
        baselineEndpointLabels: ["Terminal A", "Terminal B", "Terminal C"],
        candidateComponents: [["A"], ["B", "C"]],
      },
    ])
  }
  expect(
    findSplitPhysicalConnectivityComponents(baseline, snapshot([])),
  ).toEqual([
    {
      baselineEndpointKeys: ["A", "B", "C"],
      baselineEndpointLabels: ["Terminal A", "Terminal B", "Terminal C"],
      candidateComponents: [["A"], ["B"], ["C"]],
    },
  ])
})

test("comparison leaves snapshots unchanged and diagnostic arrays independent", () => {
  const baseline = snapshot([["A", "B", "C"]])
  const candidate = snapshot([["A", "B"], ["C"]])
  const baselineCopy = structuredClone(baseline)
  const candidateCopy = structuredClone(candidate)
  const result = findSplitPhysicalConnectivityComponents(baseline, candidate)
  const expected = [
    {
      baselineEndpointKeys: ["A", "B", "C"],
      baselineEndpointLabels: ["Terminal A", "Terminal B", "Terminal C"],
      candidateComponents: [["A", "B"], ["C"]],
    },
  ]
  expect(result).toEqual(expected)
  expect(baseline).toEqual(baselineCopy)
  expect(candidate).toEqual(candidateCopy)

  result[0].baselineEndpointKeys.push("output-only")
  result[0].baselineEndpointLabels.push("output-only")
  result[0].candidateComponents[0].push("output-only")
  expect(baseline).toEqual(baselineCopy)
  expect(candidate).toEqual(candidateCopy)

  const independentResult = findSplitPhysicalConnectivityComponents(
    baseline,
    candidate,
  )
  baseline.endpointComponents[0].push("input-only")
  baseline.endpointLabels.A = "renamed"
  candidate.endpointComponents[0].push("candidate-only")
  expect(independentResult).toEqual(expected)
})
