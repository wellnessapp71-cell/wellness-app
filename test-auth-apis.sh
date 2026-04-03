#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${AUTH_TEST_EMAIL:-auth-test-$(date +%s)@example.com}"
USERNAME="${AUTH_TEST_USERNAME:-auth_test_$(date +%s)}"
PASSWORD="${AUTH_TEST_PASSWORD:-AuthTestPass9}"

json_extract() {
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const p=process.argv[1].split('.');let v=o;for(const k of p){v=v?.[k]}if(v===undefined||v===null){process.exit(1)}process.stdout.write(String(v));}catch{process.exit(1)}})" "$1"
}

echo "=== AUTH: register (or fallback to login if exists) ==="
REGISTER_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"name\":\"Auth Test\",\"role\":\"admin\",\"referralCode\":\"ADMIN\"}")

echo "$REGISTER_RESP" | head -c 250
echo

TOKEN=""
USER_ID=""

if echo "$REGISTER_RESP" | json_extract "data.token" >/dev/null 2>&1; then
  TOKEN=$(echo "$REGISTER_RESP" | json_extract "data.token")
  USER_ID=$(echo "$REGISTER_RESP" | json_extract "data.userId")
else
  echo "Register did not return token. Trying login..."
  LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"login\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  echo "$LOGIN_RESP" | head -c 250
  echo

  TOKEN=$(echo "$LOGIN_RESP" | json_extract "data.token")
  USER_ID=$(echo "$LOGIN_RESP" | json_extract "data.userId")
fi

echo "Authenticated userId: $USER_ID"

echo -e "\n=== GET /api/plans without token (expect 401 when AUTH_COMPAT=false, or compat behavior when true) ==="
curl -s "$BASE_URL/api/plans?userId=$USER_ID" | head -c 250
echo

echo -e "\n=== POST /api/workout with token ==="
WORKOUT_RESP=$(curl -s -X POST "$BASE_URL/api/workout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"profile\":{\"userId\":\"$USER_ID\",\"age\":28,\"gender\":\"male\",\"currentWeightKg\":75,\"hasHomeEquipment\":true,\"hasGymAccess\":true,\"goals\":[\"strength\"],\"fitnessLevel\":\"intermediate\",\"fitnessSublevel\":2}}")
echo "$WORKOUT_RESP" | head -c 250
echo

echo -e "\n=== GET /api/plans with token ==="
curl -s "$BASE_URL/api/plans?userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | head -c 350
echo

echo -e "\n=== GET /api/progress with token ==="
curl -s "$BASE_URL/api/progress?userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | head -c 350
echo

echo -e "\n=== Done ==="
