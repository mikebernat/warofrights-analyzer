#!/bin/bash

# Cron job script to cleanup expired shared analyses
# Add to crontab: 0 2 * * * /path/to/cron-cleanup.sh

# Change to script directory
cd "$(dirname "$0")"

# Run cleanup script
node cleanup-shares.js >> ../logs/cleanup.log 2>&1

# Optional: Keep only last 30 days of logs
find ../logs -name "cleanup.log.*" -mtime +30 -delete
