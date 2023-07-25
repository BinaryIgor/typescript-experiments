#!/bin/bash
set -e

echo "Compiling typescript..."
tsc

echo "Typescript compiled, compiling tailwind css..."

css_path="htmx-app/static/style.css"

npx tailwindcss -i ./src/$css_path -o ./dist/$css_path

echo "Tailwind compiled, app is ready!!"