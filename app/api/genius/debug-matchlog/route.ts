import { NextResponse } from "next/server"
import { geniusFetch } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

/**
 * Debug endpoint to inspect the raw /persons/{personId}/matchlog response.
 *
 * GET /api/genius/debug-matchlog?personId=X
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const personIdStr = searchParams.get("personId")
  if (!personIdStr) return NextResponse.json({ error: "personId requerido" }, { status: 400 })

  try {
    const { id: competitionId } = await resolveLnbCompetitionIdPublic()

    // Try with competitionId filter
    const withComp = await geniusFetch(
      `/persons/${personIdStr}/matchlog?competitionId=${competitionId}&limit=100`,
      "short"
    ).catch((e: any) => ({ error: e.message }))

    // Try without filter
    const withoutComp = await geniusFetch(
      `/persons/${personIdStr}/matchlog?limit=10`,
      "short"
    ).catch((e: any) => ({ error: e.message }))

    return NextResponse.json({
      personId: personIdStr,
      competitionId,
      withCompetitionFilter: {
        keys: withComp && !withComp.error ? Object.keys(withComp) : null,
        raw: withComp,
      },
      withoutFilter: {
        keys: withoutComp && !withoutComp.error ? Object.keys(withoutComp) : null,
        raw: withoutComp,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
