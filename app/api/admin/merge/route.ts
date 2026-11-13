import { mergeComplaintAsDuplicate } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceId: string
      targetId: string
      officerNote?: string
    }
    if (!body.sourceId || !body.targetId) {
      return Response.json({ error: 'sourceId and targetId are required' }, { status: 400 })
    }
    const result = await mergeComplaintAsDuplicate({
      sourceId: body.sourceId,
      targetId: body.targetId,
      officerNote: body.officerNote,
    })
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 })
    }
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
