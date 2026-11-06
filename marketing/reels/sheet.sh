#!/bin/bash
# sheet.sh <reel-dir> t1,t2,...  -> renders frames and tiles them into <dir>/sheet.jpg
set -e
cd "$(dirname "$0")"
NODE_PATH=$(npm root -g) node export.cjs "$1" "$2"
args=(); n=0; for t in ${2//,/ }; do args+=(-i "$1/shot-$t.jpg"); n=$((n+1)); done
ffmpeg -loglevel error -y "${args[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf "[$i]scale=360:640[s$i];"; done)$(for i in $(seq 0 $((n-1))); do printf "[s$i]"; done)xstack=inputs=$n:grid=4x$(( (n+3)/4 ))" "$1/sheet.jpg"
