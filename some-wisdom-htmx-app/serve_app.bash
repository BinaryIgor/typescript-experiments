#!/bin/bash
export STYLES_PATH="${PWD}/dist/static/style.css" 

echo "Starting live-reloading tailwind styles..."
npx tailwindcss -i ./src/static/style.css -o ./dist/static/style.css --watch=always &
tailwind_pid=$!

echo "Starting live-reloading some-wisdom app..."
npx nodemon src/app.ts &
app_pid=$!

echo "App pid: $app_pid, tailwind: $tailwind_pid"

cleanup() {
    echo "Closing processes..."

    kill $tailwind_pid
    kill $app_pid

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