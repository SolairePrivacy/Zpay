# Payment Processing Runbook

## Trigger Conditions
- Health check `/api/health` responds with `503`.
- Merchant dashboard shows `failed` or `expired` spikes.
- Bridger orders without matching Solana transaction hash.

## Immediate Actions
1. Verify AWS Amplify deployment status and last successful build.
2. Check Upstash Redis availability with `redis-cli -u $UPSTASH_REDIS_REST_URL ping`.
3. Review QStash delivery dashboard for stuck or retried requests.
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
3. **QStash Delivery Failures**
   - Check the Upstash QStash dashboard for alerting webhooks.
   - Requeue failed deliveries or update `QSTASH_TOPIC` routing if the destination changed.

## Postmortem Checklist
- Document timeline in incident tracker.
- Capture relevant session payloads (without PII) and attach to incident.
- Create follow-up tasks for automation gaps discovered.

