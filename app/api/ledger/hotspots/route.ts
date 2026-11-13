import { getHotspots } from '@/lib/api'

export async function GET() {
  return Response.json(await getHotspots())
}
