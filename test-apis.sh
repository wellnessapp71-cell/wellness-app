#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${AUTH_TEST_EMAIL:-api-test-$(date +%s)@example.com}"
USERNAME="${AUTH_TEST_USERNAME:-api_test_$(date +%s)}"
PASSWORD="${AUTH_TEST_PASSWORD:-AuthTestPass9}"

json_extract() {
	node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const p=process.argv[1].split('.');let v=o;for(const k of p){v=v?.[k]}if(v===undefined||v===null){process.exit(1)}process.stdout.write(String(v));}catch{process.exit(1)}})" "$1"
}

echo "=== AUTH bootstrap ==="
REGISTER_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
	-H "Content-Type: application/json" \
	-d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"name\":\"API Test\",\"role\":\"admin\",\"referralCode\":\"ADMIN\"}")

if echo "$REGISTER_RESP" | json_extract "data.token" >/dev/null 2>&1; then
	TOKEN=$(echo "$REGISTER_RESP" | json_extract "data.token")
	USER_ID=$(echo "$REGISTER_RESP" | json_extract "data.userId")
else
	LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
		-H "Content-Type: application/json" \
		-d "{\"login\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
	TOKEN=$(echo "$LOGIN_RESP" | json_extract "data.token")
	USER_ID=$(echo "$LOGIN_RESP" | json_extract "data.userId")
fi

echo "Using userId: $USER_ID"

echo "=== YOGA ==="
curl -s -X POST "$BASE_URL/api/yoga" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"profile\":{\"userId\":\"$USER_ID\",\"fitnessLevel\":\"beginner\",\"goals\":[\"fat_loss\"]}}" | head -c 200
echo

echo -e "\n=== NUTRITION: estimate-meal ==="
curl -s -X POST "$BASE_URL/api/nutrition" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"action":"estimate-meal","input":{"mealDescription":"A bowl of oatmeal"}}' | head -c 200
echo

echo -e "\n=== NUTRITION: analyze-week ==="
curl -s -X POST "$BASE_URL/api/nutrition" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"action\":\"analyze-week\",\"input\":{\"profile\":{\"userId\":\"$USER_ID\",\"age\":25,\"gender\":\"male\",\"currentWeightKg\":75,\"nutritionGoal\":\"maintain\",\"weeklyCalorieBurned\":2000},\"entries\":[{\"dateIso\":\"2026-03-24T00:00:00Z\",\"mealDescription\":\"Oatmeal\",\"calories\":400}]}}" | head -c 200
echo

echo -e "\n=== NUTRITION: build-meal-plan-prompt ==="
curl -s -X POST "$BASE_URL/api/nutrition" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"action":"build-meal-plan-prompt","input":{"age":25,"gender":"male","heightCm":180,"weightKg":75,"activityLevel":"moderate","diet":"omnivore","cuisine":"american","allergies":[],"medicalConditions":[],"goal":"lose weight","dislikes":[]}}' | head -c 200
echo

echo -e "\n=== GET PLANS ($USER_ID) ==="
curl -s "$BASE_URL/api/plans?userId=$USER_ID" -H "Authorization: Bearer $TOKEN" | head -c 500
echo

echo -e "\n=== GET PROGRESS ($USER_ID) ==="
curl -s "$BASE_URL/api/progress?userId=$USER_ID" -H "Authorization: Bearer $TOKEN" | head -c 500
echo
