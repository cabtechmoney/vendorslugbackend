#!/usr/bin/env bash
set -o errexit

# Run gunicorn using python3 explicitly to avoid PATH issues
python3 -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT