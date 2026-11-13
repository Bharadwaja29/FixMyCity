import { getAdminComplaintDetail, updateComplaintStatus, type ComplaintStatus } from '@/lib/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const data = await getAdminComplaintDetail(id)
  if (!data) {
    return Response.json({ error: 'Complaint not found' }, { status: 404 })
  }
  return Response.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const body = (await request.json()) as {
      status: ComplaintStatus
      note?: string
      officerName?: string
      officerRole?: string
    }
    if (!body.status) {
      return Response.json({ error: 'Status is required' }, { status: 400 })
    }
    const result = await updateComplaintStatus({
      id,
      status: body.status,
      note: body.note,
      officerName: body.officerName,
      officerRole: body.officerRole,
    })
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 })
    }
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
