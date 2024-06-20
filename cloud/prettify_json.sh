#!/bin/bash

while IFS= read -r line; do
  if echo "$line" | jq '.' > /dev/null 2>&1; then
    echo "$line" | jq '.'
  else
    echo "$line"
  fi
done
