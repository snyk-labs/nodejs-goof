#!/bin/bash
# the first argument is the script name to be ran as <script-name>/cli.py

# the rest of the arguments can be applied as-is
poetry run python /app/ci_scripts_library/${1}/cli.py "${@:2}"