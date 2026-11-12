import { listWards } from '@/lib/api'

export async function GET() {
  return Response.json(await listWards())
}
