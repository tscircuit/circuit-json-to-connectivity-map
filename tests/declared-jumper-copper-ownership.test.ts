import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "../src"

function makePortPair(componentId: string, index: number): AnyCircuitElement[] {
  const sourcePortId = `${componentId}_pin${index}`
  const pcbPortId = `${componentId}_pad${index}`
  const x = (index - 1) * 2
  return [
    {
      type: "source_port",
      source_port_id: sourcePortId,
      source_component_id: componentId,
      name: `${index}`,
    },
    {
      type: "pcb_port",
      pcb_port_id: pcbPortId,
      source_port_id: sourcePortId,
      x,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: `${componentId}_smtpad${index}`,
      pcb_component_id: `${componentId}_pcb`,
      pcb_port_id: pcbPortId,
      shape: "rect",
      x,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
    },
  ]
}

function makePcbComponent(componentId: string): AnyCircuitElement {
  return {
    type: "pcb_component",
    pcb_component_id: `${componentId}_pcb`,
    source_component_id: componentId,
    center: { x: 0, y: 0 },
    width: 6,
    height: 2,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  }
}

function makeWireBridge(params: {
  id: string
  componentId: string
  fromPad: number
  toPad: number
}): PcbTrace {
  const { id, componentId, fromPad, toPad } = params
  return {
    type: "pcb_trace",
    pcb_trace_id: id,
    pcb_component_id: `${componentId}_pcb`,
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        layer: "top",
        width: 0.25,
        start_pcb_port_id: `${componentId}_pad${fromPad}`,
      },
      {
        route_type: "wire",
        x: 2,
        y: 0,
        layer: "top",
        width: 0.25,
        end_pcb_port_id: `${componentId}_pad${toPad}`,
      },
    ],
  }
}

function makeThroughPadBridge(params: {
  id: string
  componentId: string
  fromPad: number
  viaSmtPad: number
  toPad: number
}): PcbTrace {
  const { id, componentId, fromPad, viaSmtPad, toPad } = params
  return {
    type: "pcb_trace",
    pcb_trace_id: id,
    pcb_component_id: `${componentId}_pcb`,
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        layer: "top",
        width: 0.25,
        start_pcb_port_id: `${componentId}_pad${fromPad}`,
      },
      {
        route_type: "through_pad",
        start: { x: 0.5, y: 0 },
        end: { x: 1.5, y: 0 },
        width: 0.25,
        start_layer: "top",
        end_layer: "top",
        pcb_smtpad_id: `${componentId}_smtpad${viaSmtPad}`,
      },
      {
        route_type: "wire",
        x: 2,
        y: 0,
        layer: "top",
        width: 0.25,
        end_pcb_port_id: `${componentId}_pad${toPad}`,
      },
    ],
  }
}

test("only a jumper's declared internal connection can own its footprint copper", () => {
  const bridge = makeWireBridge({
    id: "bridge",
    componentId: "JP1",
    fromPad: 1,
    toPad: 2,
  })
  const circuitJson: AnyCircuitElement[] = [
    ...makePortPair("JP1", 1),
    ...makePortPair("JP1", 2),
    ...makePortPair("JP1", 3),
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "JP1_bridge",
      source_component_id: "JP1",
      source_port_ids: ["JP1_pin1", "JP1_pin2"],
    },
    makePcbComponent("JP1"),
    bridge,
    makeWireBridge({
      id: "wrong_bridge",
      componentId: "JP1",
      fromPad: 1,
      toPad: 3,
    }),
    {
      ...bridge,
      pcb_trace_id: "other_component_bridge",
      pcb_component_id: "other_component",
    },
    {
      ...bridge,
      pcb_trace_id: "repeated_port_bridge",
      route: [bridge.route[0], bridge.route[0]],
    },
  ]

  for (const orderedCircuit of [circuitJson, circuitJson.toReversed()]) {
    const connMap = getFullConnectivityMapFromCircuitJson(orderedCircuit)
    expect(
      connMap.areAllIdsConnected([
        "JP1_bridge",
        "bridge",
        "JP1_pin1",
        "JP1_pin2",
      ]),
    ).toBe(true)
    expect(connMap.areIdsConnected("bridge", "JP1_pin3")).toBe(false)
    expect(connMap.getNetConnectedToId("wrong_bridge")).toBeUndefined()
    expect(connMap.getNetConnectedToId("repeated_port_bridge")).toBeUndefined()
    expect(
      connMap.getNetConnectedToId("other_component_bridge"),
    ).toBeUndefined()
  }
})

test("transitive internal connections, internally_connected_source_port_ids, and through_pad routes own matching copper without merging disjoint groups", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "JP_INLINE",
      ftype: "simple_chip",
      name: "JP_INLINE",
      internally_connected_source_port_ids: [
        ["JP_INLINE_pin1", "JP_INLINE_pin2"],
      ],
    },
    ...makePortPair("JP_INLINE", 1),
    ...makePortPair("JP_INLINE", 2),
    makePcbComponent("JP_INLINE"),
    makeWireBridge({
      id: "inline_bridge",
      componentId: "JP_INLINE",
      fromPad: 1,
      toPad: 2,
    }),
    ...[1, 2, 3, 4].flatMap((index) => makePortPair("SW1", index)),
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "SW1_g1_a",
      source_component_id: "SW1",
      source_port_ids: ["SW1_pin1", "SW1_pin2"],
    },
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "SW1_g1_b",
      source_component_id: "SW1",
      source_port_ids: ["SW1_pin1", "SW1_pin3"],
    },
    {
      type: "source_component_internal_connection",
      source_component_internal_connection_id: "SW1_single_pin",
      source_component_id: "SW1",
      source_port_ids: ["SW1_pin4"],
    },
    makePcbComponent("SW1"),
    makeWireBridge({
      id: "transitive_bridge_2_3",
      componentId: "SW1",
      fromPad: 2,
      toPad: 3,
    }),
    makeWireBridge({
      id: "cross_group_bridge_3_4",
      componentId: "SW1",
      fromPad: 3,
      toPad: 4,
    }),
    makeThroughPadBridge({
      id: "through_pad_valid_bridge",
      componentId: "SW1",
      fromPad: 1,
      viaSmtPad: 2,
      toPad: 3,
    }),
    makeThroughPadBridge({
      id: "through_pad_unbridged_pin4",
      componentId: "SW1",
      fromPad: 2,
      viaSmtPad: 4,
      toPad: 3,
    }),
  ]

  for (const orderedCircuit of [circuitJson, circuitJson.toReversed()]) {
    const connMap = getFullConnectivityMapFromCircuitJson(orderedCircuit)
    expect(
      connMap.areAllIdsConnected([
        "inline_bridge",
        "JP_INLINE_pin1",
        "JP_INLINE_pin2",
      ]),
    ).toBe(true)
    expect(
      connMap.areAllIdsConnected([
        "SW1_g1_a",
        "SW1_g1_b",
        "transitive_bridge_2_3",
        "through_pad_valid_bridge",
        "SW1_pin1",
        "SW1_pin2",
        "SW1_pin3",
      ]),
    ).toBe(true)
    expect(connMap.areIdsConnected("SW1_pin1", "SW1_pin4")).toBe(false)
    expect(
      connMap.getNetConnectedToId("through_pad_unbridged_pin4"),
    ).toBeUndefined()
    expect(
      connMap.getNetConnectedToId("cross_group_bridge_3_4"),
    ).toBeUndefined()
  }
})
