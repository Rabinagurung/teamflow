const BILLING_SYNC_WEBHOOK_TYPES = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.revoked",
  "subscription.uncanceled",
  "subscription.past_due",
])

type PolarWebhooksPayloadLike = {
  type?: string
  timestamp?: Date | string
  data?: {
    id?: string
  }
}

export function shouldSyncBillingForPolarWebhook(
  payload: PolarWebhooksPayloadLike,
) {
  if (!payload.type) return false

  return BILLING_SYNC_WEBHOOK_TYPES.has(payload.type)
}

export function getPolarWebhookEventID(payload: PolarWebhooksPayloadLike) {
  const type = payload.type
  const dataId = payload.data?.id
  const timestamp =
    payload.timestamp instanceof Date
      ? payload.timestamp.toISOString()
      : payload.timestamp

  if (!type || !dataId || !timestamp) {
    return null
  }

  return `${type}:${dataId}:${timestamp}`
}
