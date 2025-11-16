#!/usr/bin/env bash

# Fail on errors
set -e

# Optional: set the working directory to the script's location
cd "$(dirname "$0")"

# Run the Plumber API
Rscript -e "
library(plumber);
pr <- plumb('server.R');
pr\$run(
  host = '0.0.0.0',
  port = 8001
)
"

