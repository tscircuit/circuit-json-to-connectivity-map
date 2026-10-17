import { mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { findConnectedNetworks } from "../src/findConnectedNetworks"
import skAm62ConnectivityFixture from "../tests/assets/sk-am62-connectivity-connections.json"

type BenchmarkSample = {
  sampleNumber: number
  sampleName: string
  connections: string[][]
}

type BenchmarkResult = BenchmarkSample & {
  durationSeconds: number
  networkCount: number
}

type BenchmarkSelection = {
  limit?: number
  sampleNumber?: number
}

const benchmarkSamples: BenchmarkSample[] = [
  {
    sampleName: "sk-am62",
    connections: skAm62ConnectivityFixture.connections,
  },
  ...[1_000, 2_000, 4_000, 8_000, 12_000].map((independentNetCount) => ({
    sampleName: `${independentNetCount}-independent-nets`,
    connections: createIndependentConnections(independentNetCount),
  })),
].map((sample, sampleIndex) => ({
  ...sample,
  sampleNumber: sampleIndex + 1,
}))

function printHelp(): void {
  console.log(`Usage: ./benchmark.sh [options]

Options:
  --help          Show this help text
  --limit NUM     Run only the first NUM samples
  --sample NUM    Run one sample by its one-based number`)
}

function parseBenchmarkSelection(
  commandLineArgs: string[],
): BenchmarkSelection {
  const selection: BenchmarkSelection = {}

  for (
    let argumentIndex = 0;
    argumentIndex < commandLineArgs.length;
    argumentIndex++
  ) {
    const argument = commandLineArgs[argumentIndex]
    if (argument === "--help") {
      printHelp()
      process.exit(0)
    }
    if (argument !== "--limit" && argument !== "--sample") {
      throw new Error(`Unknown benchmark option: ${argument}`)
    }

    const countArgument = commandLineArgs[++argumentIndex]
    const count = Number(countArgument)
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`${argument} requires a positive integer`)
    }

    if (argument === "--limit") selection.limit = count
    if (argument === "--sample") selection.sampleNumber = count
  }

  return selection
}

function selectBenchmarkSamples(
  selection: BenchmarkSelection,
): BenchmarkSample[] {
  if (selection.sampleNumber !== undefined) {
    const sample = benchmarkSamples.find(
      ({ sampleNumber }) => sampleNumber === selection.sampleNumber,
    )
    if (!sample) throw new Error(`Unknown sample: ${selection.sampleNumber}`)
    return [sample]
  }

  return benchmarkSamples.slice(0, selection.limit)
}

function createIndependentConnections(independentNetCount: number): string[][] {
  return Array.from({ length: independentNetCount }, (_, netIndex) => [
    `source_trace_${netIndex}`,
    `source_port_${netIndex}_a`,
    `source_port_${netIndex}_b`,
  ])
}

function runBenchmarkSample(sample: BenchmarkSample): BenchmarkResult {
  const startedAt = performance.now()
  const networks = findConnectedNetworks(sample.connections)
  const durationSeconds = (performance.now() - startedAt) / 1_000

  return {
    ...sample,
    durationSeconds,
    networkCount: Object.keys(networks).length,
  }
}

function getPercentile(durations: number[], percentile: number): number {
  const sortedDurations = durations.toSorted((first, second) => first - second)
  const percentileIndex = Math.ceil(percentile * sortedDurations.length) - 1
  return sortedDurations[Math.max(0, percentileIndex)] ?? 0
}

function getNextRunNumber(): number {
  mkdirSync("results", { recursive: true })
  const priorRunNumbers = readdirSync("results")
    .map((entryName) => /^run(\d+)$/.exec(entryName)?.[1])
    .filter((runNumber): runNumber is string => runNumber !== undefined)
    .map(Number)

  return Math.max(0, ...priorRunNumbers) + 1
}

const selection = parseBenchmarkSelection(process.argv.slice(2))
const selectedSamples = selectBenchmarkSamples(selection)
const benchmarkResults = selectedSamples.map(runBenchmarkSample)
const runNumber = getNextRunNumber()
const runDirectory = `results/run${runNumber.toString().padStart(3, "0")}`
mkdirSync(runDirectory, { recursive: true })

const incrementalLines = benchmarkResults.map(
  ({ sampleNumber, sampleName, connections, networkCount, durationSeconds }) =>
    `sample${sampleNumber.toString().padStart(3, "0")} name=${sampleName.padEnd(
      22,
    )} connections=${connections.length
      .toString()
      .padStart(5, "0")} networks=${networkCount
      .toString()
      .padStart(5, "0")} duration=${durationSeconds.toFixed(3)}s`,
)
const durations = benchmarkResults.map(({ durationSeconds }) => durationSeconds)
const averageDuration =
  durations.reduce(
    (durationTotal, durationSeconds) => durationTotal + durationSeconds,
    0,
  ) / durations.length
const summaryLines = [
  `avg duration: ${averageDuration.toFixed(3)}s`,
  `P50 duration: ${getPercentile(durations, 0.5).toFixed(3)}s`,
  `P95 duration: ${getPercentile(durations, 0.95).toFixed(3)}s`,
]
const logPath = `${runDirectory}/logs.txt`
writeFileSync(logPath, [...incrementalLines, ...summaryLines, ""].join("\n"))

for (const incrementalLine of incrementalLines) console.log(incrementalLine)
console.log(`# wrote ${logPath}`)
for (const summaryLine of summaryLines) console.log(summaryLine)
