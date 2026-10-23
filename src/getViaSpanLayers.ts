import type { LayerRef } from "circuit-json"

export const getViaSpanLayers = ({
  fromLayer,
  toLayer,
  layerCount,
}: {
  fromLayer: LayerRef
  toLayer: LayerRef
  layerCount: number
}): LayerRef[] => {
  if (fromLayer === toLayer) return [fromLayer]
  const stack: LayerRef[] = ["top"]
  for (let i = 1; i <= layerCount - 2; i++) {
    stack.push(`inner${i}` as LayerRef)
  }
  stack.push("bottom")
  const fromIndex = stack.indexOf(fromLayer)
  const toIndex = stack.indexOf(toLayer)
  if (fromIndex === -1 || toIndex === -1) return [fromLayer, toLayer]
  return fromIndex <= toIndex
    ? stack.slice(fromIndex, toIndex + 1)
    : stack.slice(toIndex, fromIndex + 1).reverse()
}
