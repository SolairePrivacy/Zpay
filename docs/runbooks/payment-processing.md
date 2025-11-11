# Payment Processing Runbook

## Trigger Conditions
- Health check `/api/health` responds with `503`.
- Merchant dashboard shows `failed` or `expired` spikes.
- Flashift orders without matching Solana transaction hash.

## Immediate Actions
1. Verify AWS Amplify deployment status and last successful build.
2. Check Upstash Redis availability with `redis-cli -u $UPSTASH_REDIS_REST_URL ping`.
3. Review Kafka topic lag via Upstash console for `payment-events`.
4. Inspect CloudWatch logs (Amplify backend) for `payment session` errors.

## Containment
- Disable merchant webhooks from Amplify environment variables if flooding downstream systems.
- Pause cron triggers hitting `/api/payments/cron` until upstream services recover.

## Remediation Steps
1. **Zcash Detection Failures**
   - Validate `ZCASH_RPC_URL` and the configured authentication method (basic credentials or `ZCASH_RPC_COOKIE_PATH`).
   - Run manual RPC `z_listreceivedbyaddress` with session address.
   - If node lagging, failover to secondary endpoint and redeploy Amplify environment.
2. **Flashift Execution Failures**
   - Confirm `FLASHIFT_API_KEY` is valid via test `createTransaction`.
   - Inspect Flashift status dashboard for degradation notice.
   - Retry session by re-triggering `/api/payments/cron` once upstream healthy.
3. **Kafka Event Drift**
   - Reset consumer offsets to latest via Upstash console.
   - Regenerate consumer group id by updating `UPSTASH_KAFKA_CONSUMER_GROUP`.

## Postmortem Checklist
- Document timeline in incident tracker.
- Capture relevant session payloads (without PII) and attach to incident.
- Create follow-up tasks for automation gaps discovered.

