#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

build() { echo "Building $1..."; docker build -t "$1" "$ROOT/$2"; }

build ai-sandbox-python:latest sandbox-images/python
build ai-sandbox-node:latest   sandbox-images/node
build ai-sandbox-go:latest     sandbox-images/go

echo "All sandbox images built."
