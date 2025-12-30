#!/bin/bash
# Backfill Level data for user trungnguyen
# This script re-saves KPI data to trigger auto-fill Level logic

USER_ID=866
YEAR=2026

echo "Backfilling Level data for user $USER_ID in $YEAR..."

# Month 1
echo "Processing Month 1..."
curl -X POST http://localhost:3000/api/kpi-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": '$USER_ID',
    "year": '$YEAR',
    "month": 1,
    "kpiData": [
      {"templateId": 1, "actualValue": 1},
      {"templateId": 2, "actualValue": 10},
      {"templateId": 3, "actualValue": 2},
      {"templateId": 4, "actualValue": 80},
      {"templateId": 5, "actualValue": 6},
      {"templateId": 6, "actualValue": 1}
    ]
  }'

echo ""
echo "Processing Month 2..."
curl -X POST http://localhost:3000/api/kpi-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": '$USER_ID',
    "year": '$YEAR',
    "month": 2,
    "kpiData": [
      {"templateId": 1, "actualValue": 2},
      {"templateId": 2, "actualValue": 3},
      {"templateId": 3, "actualValue": 2},
      {"templateId": 4, "actualValue": 70},
      {"templateId": 5, "actualValue": 5},
      {"templateId": 6, "actualValue": 1}
    ]
  }'

echo ""
echo "Done! Level data should now be available."
