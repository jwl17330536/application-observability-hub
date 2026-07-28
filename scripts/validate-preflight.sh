#!/bin/bash
set -e

# Pre-flight validation script for Application Observability Hub
# Tests Document Store token access and validates environment

echo "🔍 Application Observability Hub - Pre-Flight Validation"
echo "=========================================================="

# Check required environment variables
if [ -z "$DT_ENVIRONMENT_URL" ]; then
  echo "❌ DT_ENVIRONMENT_URL not set"
  exit 1
fi

if [ -z "$DT_PLATFORM_TOKEN" ]; then
  echo "❌ DT_PLATFORM_TOKEN not set"
  exit 1
fi

echo "✅ Environment variables configured"

# Test Document Store access
echo ""
echo "Testing Document Store access..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Api-Token $DT_PLATFORM_TOKEN" \
  "$DT_ENVIRONMENT_URL/platform/storage/resource-store/v1/files/validation-test")

if [ "$RESPONSE" == "404" ] || [ "$RESPONSE" == "200" ]; then
  echo "✅ Document Store is accessible"
else
  echo "⚠️  Document Store returned status $RESPONSE - may fall back to localStorage"
fi

echo ""
echo "🎉 Pre-flight validation complete!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run dev"
echo "3. Open http://localhost:3000"
