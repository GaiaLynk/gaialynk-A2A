#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[1/7] Create conversation"
CONV_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations" \
  -H "content-type: application/json" \
  -d '{"title":"Phase0 Demo Script Conversation"}')"
CONVERSATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$CONV_JSON")"
echo "conversation_id=$CONVERSATION_ID"

echo "[2/7] Register low-risk agent and join conversation"
LOW_AGENT_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/agents" \
  -H "content-type: application/json" \
  -d '{"name":"Low Agent","description":"Demo low risk agent","agent_type":"execution","source_url":"https://example.com/low","capabilities":[{"name":"low_task","risk_level":"low"}]}')"
LOW_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$LOW_AGENT_JSON")"
curl -sS -X POST "$BASE_URL/api/v1/conversations/$CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$LOW_AGENT_ID\"}" >/dev/null

echo "[3/7] Send low-risk message (expect allow + receipt)"
LOW_MSG_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations/$CONVERSATION_ID/messages" \
  -H "content-type: application/json" \
  -d '{"sender_id":"demo-user","text":"run low task"}')"
LOW_DECISION="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["trust_decision"]["decision"])' <<<"$LOW_MSG_JSON")"
LOW_RECEIPT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["receipt_id"])' <<<"$LOW_MSG_JSON")"
echo "low_decision=$LOW_DECISION receipt_id=$LOW_RECEIPT_ID"
[[ "$LOW_DECISION" == "allow" ]]

echo "[4/7] Create high-risk conversation + agent"
HIGH_CONV_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations" \
  -H "content-type: application/json" \
  -d '{"title":"Phase0 High Risk Conversation"}')"
HIGH_CONVERSATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$HIGH_CONV_JSON")"

HIGH_AGENT_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/agents" \
  -H "content-type: application/json" \
  -d '{"name":"High Agent","description":"Demo high risk agent","agent_type":"execution","source_url":"https://example.com/high","capabilities":[{"name":"high_task","risk_level":"high"}]}')"
HIGH_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$HIGH_AGENT_JSON")"
curl -sS -X POST "$BASE_URL/api/v1/conversations/$HIGH_CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$HIGH_AGENT_ID\"}" >/dev/null

echo "[5/7] Send high-risk message (expect need_confirmation)"
HIGH_MSG_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations/$HIGH_CONVERSATION_ID/messages" \
  -H "content-type: application/json" \
  -d '{"sender_id":"demo-user","text":"run high task"}')"
HIGH_DECISION="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["trust_decision"]["decision"])' <<<"$HIGH_MSG_JSON")"
INVOCATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["invocation_id"])' <<<"$HIGH_MSG_JSON")"
echo "high_decision=$HIGH_DECISION invocation_id=$INVOCATION_ID"
[[ "$HIGH_DECISION" == "need_confirmation" ]]

echo "[6/7] Confirm high-risk invocation"
CONFIRM_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/invocations/$INVOCATION_ID/confirm" \
  -H "content-type: application/json" \
  -d '{"approver_id":"demo-user"}')"
CONFIRM_RECEIPT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["receipt_id"])' <<<"$CONFIRM_JSON")"
echo "confirm_receipt_id=$CONFIRM_RECEIPT_ID"

echo "[7/7] Query audit and verify receipt"
AUDIT_JSON="$(curl -sS "$BASE_URL/api/v1/audit-events?conversation_id=$HIGH_CONVERSATION_ID")"
AUDIT_COUNT="$(python -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))' <<<"$AUDIT_JSON")"
echo "audit_count=$AUDIT_COUNT"

RECEIPT_JSON="$(curl -sS "$BASE_URL/api/v1/receipts/$CONFIRM_RECEIPT_ID")"
RECEIPT_VALID="$(python -c 'import json,sys; print(str(json.load(sys.stdin)["meta"]["is_valid"]).lower())' <<<"$RECEIPT_JSON")"
echo "receipt_valid=$RECEIPT_VALID"
[[ "$RECEIPT_VALID" == "true" ]]

echo "Phase0 demo script passed."
