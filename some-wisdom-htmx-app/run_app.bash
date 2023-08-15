#!/bin/bash
set -e

export DB_PATH="${PWD}/dist/assets/db"
export ASSETS_PATH="${PWD}/dist/assets"

assets_hash=$(cat dist/assets_hash.txt)

export ASSETS_STYLES_SRC="/style-${assets_hash}.css";
export ASSETS_INDEX_JS_SRC="/index-${assets_hash}.js";

exec node dist/app.js