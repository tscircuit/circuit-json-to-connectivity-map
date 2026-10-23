import { defineConfig } from "tsup"

export default defineConfig({
  // tsup-node leaves package imports external by default. The copper geometry
  // packages are devDependencies and are not installed by consumers, so bundle
  // their runtime code and transitive imports into the published package.
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
