#!/bin/bash
PROJECT_ID="1176629779216096411"
SCREENS=(
  "26a2903727d44824b9341e2c5787af5d:dashboard"
  "ea922a4d9e804d0f8f9175cb6fce9dd5:add_expense"
  "1b09631510574fecad56bd5a840a9321:categories"
  "bb92e4b413a347418ad2256919b01988:search_filters"
  "34728b00b42147849c683c123c51f4b2:daily_report"
  "add07b5311dc47768dd2e087eb535185:monthly_report"
  "cca47d16e1ae44088a6116351c7fde41:yearly_report"
  "3ab22aacb6fe44e5a133e9fe357d7805:login"
  "66584078eed3482e94f5f39db83dd761:signup"
)

mkdir -p stitch_data

for item in "${SCREENS[@]}"; do
  ID="${item%%:*}"
  NAME="${item#*:}"
  echo "Fetching $NAME ($ID)..."
  # Trying stitch.withgoogle.com instead
  curl -L "https://stitch.withgoogle.com/api/project/$PROJECT_ID/screen/$ID" -o "stitch_data/$NAME.json"
done
