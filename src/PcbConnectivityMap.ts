import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type {
  AnyCircuitElement,
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  PcbTrace,
  PcbVia,
} from "circuit-json"
import { ConnectivityMap } from "./ConnectivityMap"
import { findConnectedNetworks } from "./findConnectedNetworks"
import {
  doCopperTargetsTouch,
  doesPortTouchTrace,
  doesPortTouchVia,
  doesTraceTouchCopperTarget,
  type PcbPad,
  type SupportedCopperPour,
} from "./pcbPhysicalContact"

type PcbPortId = PcbPort["pcb_port_id"]
type PcbTraceId = PcbTrace["pcb_trace_id"]

const getViaNodeId = (via: PcbVia) => `via:${via.pcb_via_id}`
const getPourNodeId = (pour: SupportedCopperPour) =>
  `copper_pour:${pour.pcb_copper_pour_id}`

/**
 * Maps copper that is physically connected on the PCB. Trace endpoint ids are
 * only used when their referenced port is absent from the Circuit JSON; when a
 * port exists, geometry is authoritative.
 */
export class PcbConnectivityMap {
  circuitJson: AnyCircuitElement[]
  traceIdToElm: Map<PcbTraceId, PcbTrace>
  portIdToElm: Map<PcbPortId, PcbPort>
  connMap: ConnectivityMap

  private readonly pads: PcbPad[]
  private readonly vias: PcbVia[]
  private readonly copperPours: SupportedCopperPour[]

  constructor(circuitJson: AnyCircuitElement[] = []) {
    this.circuitJson = circuitJson
    this.traceIdToElm = new Map()
    this.portIdToElm = new Map()
    this.pads = circuitJson.filter(
      (element): element is PcbSmtPad | PcbPlatedHole =>
        element.type === "pcb_smtpad" || element.type === "pcb_plated_hole",
    )
    this.vias = circuitJson.filter(
      (element): element is PcbVia => element.type === "pcb_via",
    )
    this.copperPours = circuitJson.filter(
      (element): element is SupportedCopperPour =>
        element.type === "pcb_copper_pour",
    )
    this._buildTraceMap()
    this._buildPortMap()
    this.connMap = this._buildTraceConnectivityMap()
  }

  private _buildPortMap() {
    for (const element of this.circuitJson) {
      if (element.type === "pcb_port") {
        this.portIdToElm.set(element.pcb_port_id, element)
      }
    }
  }

  private _buildTraceMap() {
    for (const element of this.circuitJson) {
      if (element.type === "pcb_trace") {
        this.traceIdToElm.set(element.pcb_trace_id, element)
      }
    }
  }

  private _buildTraceConnectivityMap(): ConnectivityMap {
    const traceIds = Array.from(this.traceIdToElm.keys())
    const connections: string[][] = [
      ...traceIds.map((traceId) => [traceId]),
      ...Array.from(this.portIdToElm.keys()).map((portId) => [portId]),
      ...this.vias.map((via) => [getViaNodeId(via)]),
      ...this.copperPours.map((pour) => [getPourNodeId(pour)]),
    ]

    for (let firstIndex = 0; firstIndex < traceIds.length; firstIndex++) {
      const firstTrace = this.traceIdToElm.get(traceIds[firstIndex])
      if (!firstTrace) continue
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < traceIds.length;
        secondIndex++
      ) {
        const secondTrace = this.traceIdToElm.get(traceIds[secondIndex])
        if (
          secondTrace &&
          this._arePcbTracesConnected(firstTrace, secondTrace)
        ) {
          connections.push([firstTrace.pcb_trace_id, secondTrace.pcb_trace_id])
        }
      }
    }

    this._connectPorts(connections)
    this._connectViasAndPours(connections)
    this._connectMissingPortReferences(connections)

    return new ConnectivityMap(findConnectedNetworks(connections))
  }

  private _connectPorts(connections: string[][]) {
    for (const port of this.portIdToElm.values()) {
      const portPads = this.pads.filter(
        (pad) => pad.pcb_port_id === port.pcb_port_id,
      )
      for (const trace of this.traceIdToElm.values()) {
        const touchesPort =
          portPads.length > 0
            ? portPads.some((pad) =>
                doesTraceTouchCopperTarget({ trace, target: pad }),
              )
            : doesPortTouchTrace({ port, trace })
        if (touchesPort) {
          connections.push([port.pcb_port_id, trace.pcb_trace_id])
        }
      }
      for (const via of this.vias) {
        if (
          (portPads.length > 0 &&
            portPads.some((pad) => doCopperTargetsTouch(pad, via))) ||
          (portPads.length === 0 && doesPortTouchVia(port, via))
        ) {
          connections.push([port.pcb_port_id, getViaNodeId(via)])
        }
      }
      for (const pour of this.copperPours) {
        if (portPads.some((pad) => doCopperTargetsTouch(pad, pour))) {
          connections.push([port.pcb_port_id, getPourNodeId(pour)])
        }
      }
    }
  }

  private _connectViasAndPours(connections: string[][]) {
    for (const trace of this.traceIdToElm.values()) {
      for (const via of this.vias) {
        if (doesTraceTouchCopperTarget({ trace, target: via })) {
          connections.push([trace.pcb_trace_id, getViaNodeId(via)])
        }
      }
      for (const pour of this.copperPours) {
        if (doesTraceTouchCopperTarget({ trace, target: pour })) {
          connections.push([trace.pcb_trace_id, getPourNodeId(pour)])
        }
      }
    }

    for (const via of this.vias) {
      for (const pour of this.copperPours) {
        if (doCopperTargetsTouch(via, pour)) {
          connections.push([getViaNodeId(via), getPourNodeId(pour)])
        }
      }
    }

    for (
      let firstIndex = 0;
      firstIndex < this.copperPours.length;
      firstIndex++
    ) {
      const firstPour = this.copperPours[firstIndex]
      if (!firstPour) continue
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < this.copperPours.length;
        secondIndex++
      ) {
        const secondPour = this.copperPours[secondIndex]
        if (secondPour && doCopperTargetsTouch(firstPour, secondPour)) {
          connections.push([
            getPourNodeId(firstPour),
            getPourNodeId(secondPour),
          ])
        }
      }
    }
  }

  private _connectMissingPortReferences(connections: string[][]) {
    for (const trace of this.traceIdToElm.values()) {
      for (const routePoint of trace.route) {
        if (routePoint.route_type !== "wire") continue
        for (const portId of [
          routePoint.start_pcb_port_id,
          routePoint.end_pcb_port_id,
        ]) {
          if (portId && !this.portIdToElm.has(portId)) {
            connections.push([trace.pcb_trace_id, portId])
          }
        }
      }
    }
  }

  addTrace(trace: PcbTrace) {
    this.traceIdToElm.set(trace.pcb_trace_id, trace)
    this.connMap = this._buildTraceConnectivityMap()
  }

  _arePcbTracesConnected(firstTrace: PcbTrace, secondTrace: PcbTrace): boolean {
    for (
      let firstIndex = 0;
      firstIndex < firstTrace.route.length - 1;
      firstIndex++
    ) {
      const firstStart = firstTrace.route[firstIndex]
      const firstEnd = firstTrace.route[firstIndex + 1]
      if (firstStart?.route_type !== "wire") continue
      if (firstEnd?.route_type !== "wire") continue
      if (firstStart.layer !== firstEnd.layer) continue
      for (
        let secondIndex = 0;
        secondIndex < secondTrace.route.length - 1;
        secondIndex++
      ) {
        const secondStart = secondTrace.route[secondIndex]
        const secondEnd = secondTrace.route[secondIndex + 1]
        if (secondStart?.route_type !== "wire") continue
        if (secondEnd?.route_type !== "wire") continue
        if (secondStart.layer !== secondEnd.layer) continue
        if (firstStart.layer !== secondStart.layer) continue
        if (
          doesLineIntersectLine(
            [firstStart, firstEnd],
            [secondStart, secondEnd],
            { lineThickness: (firstStart.width + secondStart.width) / 2 },
          )
        ) {
          return true
        }
      }
    }
    return false
  }

  areTracesConnected(firstTraceId: PcbTraceId, secondTraceId: PcbTraceId) {
    return this.connMap.areIdsConnected(firstTraceId, secondTraceId)
  }

  arePortsConnected(firstPortId: PcbPortId, secondPortId: PcbPortId) {
    return this.connMap.areIdsConnected(firstPortId, secondPortId)
  }

  getConnectivityNetIdForPort(portId: PcbPortId) {
    return this.connMap.getNetConnectedToId(portId)
  }

  getAllTracesConnectedToTrace(traceId: PcbTraceId): PcbTrace[] {
    const netId = this.connMap.getNetConnectedToId(traceId)
    return netId
      ? this.connMap
          .getIdsConnectedToNet(netId)
          .filter((id) => this.traceIdToElm.has(id))
          .map((id) => this.traceIdToElm.get(id))
          .filter((trace): trace is PcbTrace => trace !== undefined)
      : []
  }

  getAllTracesConnectedToPort(portId: PcbPortId): PcbTrace[] {
    const netId = this.connMap.getNetConnectedToId(portId)
    return netId
      ? this.connMap
          .getIdsConnectedToNet(netId)
          .filter((id) => this.traceIdToElm.has(id))
          .map((id) => this.traceIdToElm.get(id))
          .filter((trace): trace is PcbTrace => trace !== undefined)
      : []
  }
}
