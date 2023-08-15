#!/bin/bash
set -e

export DB_PATH="${PWD}/dist/assets/db"
export STATIC_ASSETS_PATH="${PWD}/dist/assets"

node dist/app.js