import { BetaAnalyticsDataClient } from "@google-analytics/data"

const PROPERTY_ID = process.env.GA4_PROPERTY_ID
const CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n")

let client: BetaAnalyticsDataClient | null = null

function getClient() {
  if (!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error("GA4 credentials missing. Set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY.")
  }
  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    })
  }
  return client
}

interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>()
const TTL_MS = 5 * 60 * 1000

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.data as T
  const data = await loader()
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS })
  return data
}

/** Returns a map of `slug → pageViews` for all /noticias/[slug] pages in the last N days. */
export async function getNoticiasViews(daysBack = 90): Promise<Record<string, number>> {
  return cached(`noticias-views-${daysBack}`, async () => {
    const c = getClient()
    const [response] = await c.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/noticias/" },
        },
      },
      limit: 1000,
    })

    const result: Record<string, number> = {}
    for (const row of response.rows ?? []) {
      const path = row.dimensionValues?.[0]?.value ?? ""
      const views = parseInt(row.metricValues?.[0]?.value ?? "0") || 0
      // Extract slug from "/noticias/[slug]" or "/noticias/[slug]/"
      const match = path.match(/^\/noticias\/([^/?#]+)/)
      if (match) {
        const slug = match[1]
        result[slug] = (result[slug] ?? 0) + views
      }
    }
    return result
  })
}

/** Total views of a single page path, in the given date range. */
export async function getPageViews(pagePath: string, daysBack = 90): Promise<number> {
  return cached(`page-views-${pagePath}-${daysBack}`, async () => {
    const c = getClient()
    const [response] = await c.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "EXACT", value: pagePath },
        },
      },
    })
    return parseInt(response.rows?.[0]?.metricValues?.[0]?.value ?? "0") || 0
  })
}

export function isGa4Configured(): boolean {
  return Boolean(PROPERTY_ID && CLIENT_EMAIL && PRIVATE_KEY)
}
