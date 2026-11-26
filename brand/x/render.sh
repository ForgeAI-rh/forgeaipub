#!/bin/zsh
# Renders the X assets from src/*.html with headless Chrome.
cd "${0:A:h}"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot() { # file width height scale out
  "$C" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --virtual-time-budget=4000 --force-device-scale-factor=$4 \
    --window-size=$2,$3 --screenshot="$PWD/$5" "file://$PWD/src/$1" >/dev/null 2>&1
}
shot logo.html 400 400 1 forgeai-x-logo-400.png
shot logo.html 400 400 2 forgeai-x-logo-800.png
shot header.html 1500 500 1 forgeai-x-header-1500x500.png
shot header.html 1500 500 2 forgeai-x-header-3000x1000.png
ls -la *.png
