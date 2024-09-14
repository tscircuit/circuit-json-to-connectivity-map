import { ConnectivityMap } from "./ConnectivityMap"

/**
 * A PCB Connectivity Map is a connectivity map that has analyzed what traces and ports are actually connected on the
 * PCB.
 *
 * This is useful for determining how to route a trace on the PCB. For example, you may want to determine where the
 * nearest connected net point is to connect an unrouted pin.
 */
export class PcbConnectivityMap {}
