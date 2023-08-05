#!/bin/bash
export STYLES_PATH="${PWD}/dist/htmx-app/static/style.css" 

echo "Starting live-reloading app..."
npx nodemon src/htmx-app/app.ts &
app_pid=$!

echo "Starting live-reloading tailwind styles..."
npx tailwindcss -i ./src/htmx-app/static/style.css -o ./dist/htmx-app/static/style.css --watch=always &
tailwind_pid=$!

echo "App pid: $app_pid, tailwind: $tailwind_pid"

cleanup() {
    echo "Closing processes..."

    kill $app_pid
    kill $tailwind_pid

    echo "Processes closed, see you next time!"

    exit
}

trap cleanup INT

while true;
do
   echo "Live-reloading: waiting for close command"
   echo "..."
   sleep 300
   echo
done