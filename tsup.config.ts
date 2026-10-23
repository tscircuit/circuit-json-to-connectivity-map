import { defineConfig } from "tsup"

export default defineConfig({
  noExternal: [
    "@tscircuit/circuit-json-util",
    "@flatten-js/core",
    "@flatten-js/interval-tree",
    "flatbush",
    "flatqueue",
    "circuit-json",
    "zod",
    "format-si-unit",
    "parsel-js",
    "transformation-matrix",
  ],
})
