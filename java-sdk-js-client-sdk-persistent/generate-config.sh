#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
JS_APP="${ROOT}/js-application"

: "${LD_CLIENT_ID:?Set LD_CLIENT_ID (LaunchDarkly client-side ID)}"
LD_FLAG_KEY="${LD_FLAG_KEY:-widget-one}"

export LD_CLIENT_ID LD_FLAG_KEY JS_APP
python3 <<'PY'
import json
import os
import pathlib

js = pathlib.Path(os.environ["JS_APP"])
src = js / "config.example.js"
dst = js / "config.js"

cid = os.environ["LD_CLIENT_ID"]
fk = os.environ["LD_FLAG_KEY"]

text = src.read_text()
text = text.replace("'LD_CLIENT_ID'", json.dumps(cid))
text = text.replace("'LD_FLAG_KEY'", json.dumps(fk))
dst.write_text(text)
print("Wrote", dst.resolve())
PY
