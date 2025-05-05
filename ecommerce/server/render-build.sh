#!/bin/bash
set -euo pipefail

# Install dependencies
npm install --include=dev

# Build the project
npm run build