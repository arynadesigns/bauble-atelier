#!/bin/sh
# Builds the page from the source parts in src/.
#   bauble-atelier.html  the page body, as published to claude.ai (the host adds <html>/<head>)
#   index.html           a complete standalone page for GitHub Pages or any static host
set -e
cd "$(dirname "$0")"
cat src/head.html src/a.js src/shapes.js src/scene.js src/toy.js src/c.js src/details.js src/geometry.js src/d.js src/ui.js > bauble-atelier.html
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}</style>\n</head>\n<body>\n'
  cat bauble-atelier.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "Built bauble-atelier.html and index.html"
