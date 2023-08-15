#!/bin/bash
set -e

echo "Compiling js..."
rm -r -f dist
tsc 

echo "Preparing css..."
npx tailwindcss -i ./assets/style.css -o ./dist/assets/style.css

echo "Moving assets.."

# Do not override created by tailwind css (-n)!
cp -n -r assets dist/

echo "App is ready!"