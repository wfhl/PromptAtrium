#!/bin/bash

echo "======================================"
echo "Aesthetics Database Update Script"
echo "======================================"
echo ""

# Check if production URL is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: Production database URL not provided"
    echo ""
    echo "Usage: bash scripts/update-all-aesthetics.sh \"your-production-database-url\""
    echo ""
    echo "This script will update BOTH development and production databases."
    exit 1
fi

PRODUCTION_URL=$1

echo "This script will update aesthetics in BOTH databases:"
echo "1. Development database (using DATABASE_URL)"
echo "2. Production database (using provided URL)"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

echo ""
echo "Step 1: Updating DEVELOPMENT database"
echo "--------------------------------------"
USE_DEVELOPMENT=true node scripts/upsert-aesthetics.js

if [ $? -eq 0 ]; then
    echo "✅ Development database updated successfully!"
else
    echo "❌ Development database update failed!"
    echo "Continuing to production anyway..."
fi

echo ""
echo "Step 2: Updating PRODUCTION database"
echo "-------------------------------------"
PRODUCTION_DATABASE_URL="$PRODUCTION_URL" node scripts/upsert-aesthetics.js

if [ $? -eq 0 ]; then
    echo "✅ Production database updated successfully!"
else
    echo "❌ Production database update failed!"
fi

echo ""
echo "======================================"
echo "Update process complete!"
echo "======================================"