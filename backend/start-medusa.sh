#!/bin/bash

# Ensure medusa-config.js is in .medusa/server
if [ -f "medusa-config.js" ] && [ -d ".medusa/server" ]; then
  echo "Copying medusa-config.js to .medusa/server..."
  cp medusa-config.js .medusa/server/medusa-config.js
fi

# Also copy lib/constants.ts if it exists and is needed
if [ -f "lib/constants.ts" ] && [ -d ".medusa/server" ]; then
  mkdir -p .medusa/server/lib
  cp lib/constants.ts .medusa/server/lib/constants.ts
fi

# Run the original start command
cd .medusa/server && medusa start --verbose