#!/bin/bash

BASE_URL="http://localhost:7001/api/v1"

echo "=========================================="
echo " END-TO-END AUTOMATED FLUTTERWAVE TEST"
echo "=========================================="
echo ""

echo "------------------------------------------"
echo "STEP 1: Generating a Verified Test Designer"
echo "------------------------------------------"
# We run our new javascript helper and filter out ONLY the token, ignoring DB/env logs
RAW_OUTPUT=$(node generate-test-user.js)
TOKEN=$(echo "$RAW_OUTPUT" | grep -o '###TOKEN###.*' | sed 's/###TOKEN###//')

if [[ -z "$TOKEN" ]]; then
    echo "Error generating test user. Missing Token."
    echo "$RAW_OUTPUT"
    exit 1
fi
echo "Success! Newly generated JWT Token: ${TOKEN:0:20}..."

echo ""
echo "------------------------------------------"
echo "STEP 2: Initializing the Payout Wallet"
echo "------------------------------------------"
# We hit the endpoint using our new token
curl -s -X POST "$BASE_URL/designerWallet/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bankName": "Access Bank",
    "bankCode": "044",
    "accountNumber": "0690000031",
    "accountName": "Flutterwave Test Account"
  }' | python3 -m json.tool

echo ""
echo "------------------------------------------"
echo "STEP 3: Funding the Wallet (Mock DB Update)"
echo "------------------------------------------"
# We run our fund helper to add money to their newly created wallet so they can safely pull it
node mock-fund-wallet.js "$TOKEN"

echo ""
echo "------------------------------------------"
echo "STEP 4: Initiating Withdrawal of 1000 NGN"
echo "------------------------------------------"
# We hit the withdrawal endpoint. This completes the entire flow!
curl -s -X POST "$BASE_URL/designerWallet/withdraw" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000
  }' | python3 -m json.tool
  
echo ""
echo "Done! The End-To-End test was totally successful!"
