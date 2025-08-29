#!/bin/bash

# Debug: Show environment variables are available at runtime
echo "Environment Check at Runtime:"
echo "S3_ACCESS_KEY_ID available: ${S3_ACCESS_KEY_ID:+Yes}"
echo "S3_SECRET_ACCESS_KEY available: ${S3_SECRET_ACCESS_KEY:+Yes}"
echo "S3_BUCKET: $S3_BUCKET"
echo "S3_ENDPOINT: $S3_ENDPOINT"
echo "S3_FILE_URL: $S3_FILE_URL"

# Start the backend
pnpm start