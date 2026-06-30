#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:8000}"
API_KEY="${API_KEY:-}"

auth=()
[ -n "$API_KEY" ] && auth=(-H "X-API-Key: $API_KEY")

run() {
  local lang="$1" code="$2" expect="$3"
  local body resp
  body=$(jq -n --arg l "$lang" --arg c "$code" '{language:$l, code:$c}')
  resp=$(curl -sf "${auth[@]}" -H "Content-Type: application/json" -d "$body" "$API_BASE/api/v1/execute")
  echo "$resp" | jq -e --arg e "$expect" '.exit_code==0 and (.stdout|contains($e))' >/dev/null \
    || { echo "FAIL [$lang]: $resp"; exit 1; }
  echo "  PASS $lang -> $(echo "$resp" | jq -r '.stdout' | tr -d '\n') ($(echo "$resp" | jq -r '.duration_ms')ms)"
}

echo "Health check..."
curl -sf "$API_BASE/health" | jq -e '.status=="ok"' >/dev/null

echo "Running per-language smoke tests..."
run python 'print(6*7)' '42'
run node   'console.log(6*7)' '42'
run go     'package main
import "fmt"
func main(){fmt.Println(6*7)}' '42'

echo "Checking for leftover sandbox containers..."
left=$(docker ps -a --filter "label=ai-sandbox=true" --format '{{.ID}}')
[ -z "$left" ] || { echo "FAIL: leftover containers: $left"; exit 1; }
echo "  PASS no leftover containers"

echo "All smoke tests passed."
