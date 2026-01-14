#!/bin/bash
cd "/Users/winzendwyers/Sailiing bring money money money/scripts/veo"

# Web-optimierte 720p Version
ffmpeg -y -i tsc-header-loop-20s.mp4 \
  -c:v libx264 -crf 28 -preset slow \
  -vf "scale=1280:720" \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  "tsc-header-web-720p.mp4"

# Muted version für autoplay
ffmpeg -y -i tsc-header-web-720p.mp4 \
  -c:v copy -an \
  -movflags +faststart \
  "tsc-header-web-muted.mp4"

echo "=== WEB OPTIMIZED VIDEOS ==="
ls -lh tsc-header-web-*.mp4
