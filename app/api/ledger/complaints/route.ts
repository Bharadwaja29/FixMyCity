import { listComplaints, parseComplaintFilters } from '@/lib/api'

export async function GET(request: Request) {
  const filters = parseComplaintFilters(new URL(request.url).searchParams)
  return Response.json(await listComplaints(filters))
}
