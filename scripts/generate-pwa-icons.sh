#!/usr/bin/env bash
# Regenerates the PWA icon set from public/icons/icon-master.png (or another master passed as $1).
# Needs rsvg-convert (SVG) or ImageMagick (PNG). The master must be square, mark inside the central 80 percent.
set -euo pipefail
cd "$(dirname "$0")/.."
src="${1:-public/icons/icon-master.png}"
out=public/icons
for s in 192 512; do
  if [[ "$src" == *.svg ]]; then rsvg-convert -w $s -h $s "$src" -o "$out/icon-$s.png"; else magick "$src" -resize ${s}x${s} "$out/icon-$s.png"; fi
done
if [[ "$src" == *.svg ]]; then rsvg-convert -w 180 -h 180 "$src" -o "$out/apple-touch-icon.png"; else magick "$src" -resize 180x180 "$out/apple-touch-icon.png"; fi
echo "icons written to $out"
