#!/usr/bin/env bash
# exit on error
set -o errexit

# Upgrade pip and install build tools FIRST
python -m pip install --upgrade pip
python -m pip install --no-cache-dir setuptools>=69.0.0 wheel>=0.42.0

# Navigate to backend and install requirements
cd backend
python -m pip install --no-cache-dir -r requirements.txt
