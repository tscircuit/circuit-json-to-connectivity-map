#!/usr/bin/env bash
set -euo pipefail

bun benchmarks/find-connected-networks.ts "$@"
