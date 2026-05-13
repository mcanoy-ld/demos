#!/bin/sh
# POSIX sh (e.g. dash): do not use bash-only options like pipefail, or `sh generate-config.sh` will fail.
set -eu

ROOT="$(cd "$(dirname "$0")" && pwd)"
JS_APP="${ROOT}/js-application"

: "${LD_CLIENT_KEY:?Set LD_CLIENT_KEY (LaunchDarkly client-side ID)}"
LD_FLAG_KEY="${LD_FLAG_KEY:-enable-site-redesign}"

export LD_CLIENT_KEY LD_FLAG_KEY JS_APP
python3 <<'PY'
import json
import os
import pathlib

js = pathlib.Path(os.environ["JS_APP"])
src = js / "config.example.js"
dst = js / "config.js"

cid = os.environ["LD_CLIENT_KEY"]
fk = os.environ["LD_FLAG_KEY"]

text = src.read_text()
text = text.replace("'LD_CLIENT_KEY'", json.dumps(cid))
text = text.replace("'LD_FLAG_KEY'", json.dumps(fk))
dst.write_text(text)
print("Wrote", dst.resolve())
PY
