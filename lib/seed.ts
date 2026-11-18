import type { Complaint, ComplaintCategory, ComplaintStatus, Severity, StatusEvent } from './api'
import {
  CATEGORY_LEDGER_DEPARTMENT,
  DEPARTMENT_BY_CATEGORY,
  INTAKE_OFFICER,
  OFFICERS,
  STAGE_NOTES,
  escalationNote,
} from './departments'

const HOUR = 3_600_000
const DAY = 24 * HOUR

type SeedRow = [
  seq: number,
  category: ComplaintCategory,
  title: string,
  ward: string,
  status: ComplaintStatus,
  /** Days since filing (fractions allowed). */
  ago: number,
  /** Days from filing to resolution; only read for resolved rows. */
  took: number,
  severity: Severity,
  supporters: number,
  lat: number,
  lng: number,
  landmark: string,
  description?: string,
]

/*
 * Anchored around Bhagalpur, Bihar. Rows cluster on purpose (bus stand / Ward 12,
 * Adampur, Ghantaghar) so the hotspot view has something real to show.
 */
const ROWS: SeedRow[] = [
  [4217, 'Pothole', 'Deep pothole near Tilka Manjhi Chowk', 'Ward 14', 'in_progress', 11, 0, 'High', 38, 25.2452, 86.9725, 'Tilka Manjhi Chowk, east side'],
  [4209, 'Garbage', 'Garbage dumped on vacant plot behind bus stand', 'Ward 12', 'assigned', 5, 0, 'Medium', 14, 25.2431, 86.9706, 'Behind the bus stand, Ward 12', 'Household waste piling up for a week, stray dogs scattering it on the road.'],
  [4203, 'Streetlight', 'Streetlight not working near Govt School', 'Ward 12', 'received', 1.2, 0, 'Medium', 9, 25.2461, 86.9731, 'Near Govt School, Ward 12', 'Pole light outside the school gate has been off for four nights.'],
  [4198, 'Streetlight', 'Three streetlights dark on Station Road', 'Ward 9', 'resolved', 9, 3, 'Medium', 21, 25.2513, 86.9889, 'Station Road, near the level crossing'],
  [4176, 'Garbage', 'Overflowing bin outside Khalifabag market', 'Ward 21', 'resolved', 8, 1, 'Low', 6, 25.2398, 86.9812, 'Khalifabag market gate'],
  [4151, 'Drainage', 'Blocked drain causing waterlogging, Adampur', 'Ward 17', 'resolved', 15, 7, 'High', 27, 25.2367, 86.9644, 'Adampur, near the mosque lane'],
  [4133, 'Water Supply', 'Leaking main pipeline, Nathnagar', 'Ward 3', 'resolved', 13, 4, 'High', 31, 25.2271, 86.9461, 'Nathnagar main road'],
  [4120, 'Encroachment', 'Footpath blocked by stalls, Sujaganj', 'Ward 11', 'resolved', 19, 9, 'Medium', 17, 25.2489, 86.9826, 'Sujaganj market street'],
  [4102, 'Pothole', 'Broken road surface near Barari Ghat', 'Ward 2', 'resolved', 17, 6, 'Medium', 12, 25.2602, 86.9931, 'Barari Ghat approach road'],
  [4088, 'Streetlight', 'Flickering pole light, Mirjanhat', 'Ward 25', 'resolved', 14, 2, 'Low', 4, 25.2335, 86.9998, 'Mirjanhat crossing'],

  [4214, 'Pothole', 'Cracked carriageway outside Ghantaghar', 'Ward 14', 'assigned', 2.4, 0, 'High', 19, 25.2478, 86.9757, 'Ghantaghar, main carriageway'],
  [4192, 'Pothole', 'Series of potholes on Lajpat Park road', 'Ward 13', 'in_progress', 6, 0, 'Medium', 11, 25.2471, 86.9694, 'Lajpat Park road, opposite the bakery'],
  [4160, 'Encroachment', 'Hand-carts parked across Ghantaghar lane', 'Ward 14', 'escalated', 24, 0, 'Medium', 22, 25.2482, 86.9749, 'Ghantaghar lane, west entrance'],
  [4129, 'Pothole', 'Collapsed road edge near Mayaganj crossing', 'Ward 6', 'resolved', 21, 8, 'High', 29, 25.2575, 86.9655, 'Mayaganj crossing'],
  [4081, 'Pothole', 'Failed patchwork repair on Champanagar road', 'Ward 5', 'resolved', 33, 12, 'Low', 5, 25.261, 86.954, 'Champanagar road, near the culvert'],
  [4066, 'Encroachment', 'Shop extensions over drain slab, Sujaganj', 'Ward 11', 'in_progress', 16, 0, 'Medium', 8, 25.2493, 86.9831, 'Sujaganj, behind the cloth market'],

  [4211, 'Streetlight', 'Whole lane dark after transformer trip, Khalifabag', 'Ward 21', 'assigned', 1.6, 0, 'High', 24, 25.2402, 86.9806, 'Khalifabag, third lane'],
  [4187, 'Streetlight', 'Exposed wiring on pole near bus stand', 'Ward 12', 'escalated', 20, 0, 'Critical', 41, 25.2436, 86.9711, 'Bus stand east gate, Ward 12'],
  [4170, 'Streetlight', 'Two lamps out near Govt School gate', 'Ward 12', 'in_progress', 9, 0, 'Medium', 13, 25.2458, 86.9728, 'Govt School gate, Ward 12'],
  [4143, 'Streetlight', 'Dim lights on Barari Ghat steps', 'Ward 2', 'resolved', 18, 5, 'Low', 7, 25.2598, 86.9926, 'Barari Ghat steps'],
  [4110, 'Streetlight', 'Pole leaning dangerously after storm, Mirjanhat', 'Ward 25', 'resolved', 26, 3, 'Critical', 34, 25.234, 86.9992, 'Mirjanhat, near the petrol pump'],
  [4097, 'Streetlight', 'Street lamps burning in daytime, Nathnagar', 'Ward 3', 'resolved', 30, 2, 'Low', 3, 25.2275, 86.9466, 'Nathnagar, school road'],

  [4208, 'Water Supply', 'No tap water for three days, Adampur', 'Ward 17', 'in_progress', 4, 0, 'High', 46, 25.2371, 86.965, 'Adampur, overhead tank lane'],
  [4182, 'Water Supply', 'Muddy water from household taps, Sujaganj', 'Ward 11', 'assigned', 3, 0, 'Medium', 18, 25.2486, 86.982, 'Sujaganj, temple lane'],
  [4156, 'Water Supply', 'Public handpump broken near Lajpat Park', 'Ward 13', 'escalated', 22, 0, 'Medium', 15, 25.2468, 86.9701, 'Lajpat Park, north gate'],
  [4124, 'Water Supply', 'Pipeline leak flooding lane, Mayaganj', 'Ward 6', 'resolved', 20, 5, 'High', 20, 25.2569, 86.9649, 'Mayaganj, behind the post office'],
  [4075, 'Water Supply', 'Low pressure at overhead tank, Champanagar', 'Ward 5', 'resolved', 38, 14, 'Low', 6, 25.2605, 86.9552, 'Champanagar overhead tank'],

  [4206, 'Garbage', 'Burning waste heap behind the bus stand', 'Ward 12', 'received', 0.4, 0, 'High', 7, 25.2429, 86.9703, 'Behind the bus stand, Ward 12'],
  [4195, 'Garbage', 'Uncleared waste near Ghantaghar vegetable market', 'Ward 14', 'in_progress', 7, 0, 'Medium', 16, 25.2475, 86.9762, 'Ghantaghar vegetable market'],
  [4179, 'Drainage', 'Open drain overflowing at Adampur crossing', 'Ward 17', 'in_progress', 12, 0, 'High', 33, 25.2362, 86.9638, 'Adampur crossing'],
  [4165, 'Drainage', 'Silt-choked drain after rain, Khalifabag', 'Ward 21', 'assigned', 3.5, 0, 'Medium', 12, 25.2394, 86.9819, 'Khalifabag, behind the dairy'],
  [4148, 'Garbage', 'Dead animal on roadside, Barari', 'Ward 2', 'resolved', 15, 1, 'Medium', 9, 25.2606, 86.9938, 'Barari, near the bridge'],
  [4137, 'Drainage', 'Sewage backflow into houses, Adampur', 'Ward 17', 'escalated', 28, 0, 'Critical', 52, 25.237, 86.9651, 'Adampur, lane behind the school'],
  [4090, 'Garbage', 'No door-to-door pickup for a week, Mirjanhat', 'Ward 25', 'resolved', 31, 4, 'Low', 5, 25.2329, 87.0003, 'Mirjanhat, colony road'],

  [4202, 'School Facilities', 'Broken classroom door at Govt Middle School', 'Ward 12', 'assigned', 2, 0, 'Medium', 17, 25.2456, 86.9722, 'Govt Middle School, Ward 12'],
  [4174, 'School Facilities', 'No drinking water at primary school, Nathnagar', 'Ward 3', 'in_progress', 10, 0, 'High', 26, 25.2266, 86.9455, 'Primary school, Nathnagar'],
  [4141, 'School Facilities', 'Leaking roof over Class 5, Sujaganj school', 'Ward 11', 'resolved', 19, 11, 'High', 22, 25.2491, 86.9814, 'Sujaganj school'],
  [4122, 'School Facilities', 'Broken benches in Class 8, Mirjanhat school', 'Ward 25', 'resolved', 23, 13, 'Low', 8, 25.2338, 86.9985, 'Mirjanhat school'],
  [4099, 'School Facilities', 'Toilet block locked and unusable, Khalifabag school', 'Ward 21', 'escalated', 27, 0, 'High', 37, 25.2401, 86.9801, 'Khalifabag school'],

  [4200, 'Hospital Services', 'Outpatient counter closed during morning hours', 'Ward 6', 'received', 0.8, 0, 'High', 21, 25.257, 86.966, 'District hospital OPD, Mayaganj'],
  [4168, 'Hospital Services', 'Unclean wards and overflowing bins at district hospital', 'Ward 6', 'in_progress', 6, 0, 'High', 28, 25.2573, 86.9657, 'District hospital, general ward'],
  [4132, 'Hospital Services', 'Ambulance bay blocked by parked vehicles', 'Ward 6', 'resolved', 17, 4, 'Medium', 14, 25.2567, 86.9662, 'District hospital, ambulance bay'],
  [4085, 'Hospital Services', 'Medicine stock-out notice not displayed', 'Ward 14', 'resolved', 25, 9, 'Low', 6, 25.248, 86.9742, 'Urban primary health centre, Ghantaghar'],

  [4199, 'Food Safety', 'Stale food served in boys hostel mess', 'Ward 5', 'assigned', 1.8, 0, 'High', 35, 25.2605, 86.9548, 'Boys hostel mess, university road'],
  [4163, 'Food Safety', 'Unhygienic sweet shop near Station Road', 'Ward 9', 'in_progress', 7, 0, 'Medium', 12, 25.2509, 86.9881, 'Station Road, sweet shop row'],
  [4126, 'Food Safety', 'Expired packaged goods on shelves near hostel gate', 'Ward 5', 'resolved', 20, 6, 'Medium', 10, 25.2608, 86.9546, 'Hostel gate shops'],
  [4072, 'Food Safety', 'Insects found in hostel mess water tank', 'Ward 5', 'escalated', 35, 0, 'Critical', 44, 25.2612, 86.9544, 'Girls hostel mess, university road'],
]

const CATEGORY_SENTENCE: Record<ComplaintCategory, string> = {
  Pothole: 'The damaged surface is a hazard for two-wheelers and pedestrians.',
  Streetlight: 'The area is unsafe after dark.',
  Garbage: 'Waste has been left uncollected and is attracting strays.',
  Drainage: 'Dirty water is standing in the lane and entering nearby homes.',
  'Water Supply': 'Households in the lane are affected.',
  Encroachment: 'Pedestrians are being forced onto the carriageway.',
  'Damaged Infrastructure': 'The damaged public structure is a hazard for citizens.',
  'School Facilities': 'Students are affected every school day.',
  'Hospital Services': 'Patients and attendants are facing delays and discomfort.',
  'Food Safety': 'Residents are at risk of food-borne illness.',
}

export function receivedEvent(category: ComplaintCategory, at: string): StatusEvent {
  return {
    status: 'received',
    at,
    officer: INTAKE_OFFICER,
    note: `Complaint logged. Photo classified as ${category.toLowerCase()}; no duplicate found within 600 m.`,
  }
}

function buildHistory(row: SeedRow, filedMs: number, now: number): StatusEvent[] {
  const [, category, , , status, ago, took, severity] = row
  const dept = CATEGORY_LEDGER_DEPARTMENT[category]
  const officers = OFFICERS[dept]
  const notes = STAGE_NOTES[category]
  const iso = (ms: number) => new Date(ms).toISOString()
  const history: StatusEvent[] = [receivedEvent(category, iso(filedMs))]
  if (status === 'received') return history

  const spanDays = status === 'resolved' ? took : status === 'escalated' ? ago * 0.9 : ago
  const finalAt = filedMs + spanDays * DAY
  const latest = now - HOUR

  let assignedAt = filedMs + Math.max(2 * HOUR, Math.min(spanDays * 0.12 * DAY, 30 * HOUR))
  let progressAt = Math.max(assignedAt + 3 * HOUR, filedMs + spanDays * 0.35 * DAY)
  if (status === 'assigned') assignedAt = Math.min(assignedAt, latest)
  if (status === 'resolved' || status === 'escalated') {
    progressAt = Math.min(progressAt, finalAt - 2 * HOUR)
    assignedAt = Math.min(assignedAt, progressAt - HOUR)
  }
  progressAt = Math.min(progressAt, latest)

  history.push({ status: 'assigned', at: iso(assignedAt), officer: officers.assign, note: notes.assigned })
  if (status === 'assigned') return history

  history.push({ status: 'in_progress', at: iso(progressAt), officer: officers.field, note: notes.progress })
  if (status === 'in_progress') return history

  if (status === 'resolved') {
    history.push({ status: 'resolved', at: iso(finalAt), officer: officers.field, note: notes.resolved })
  } else {
    history.push({ status: 'escalated', at: iso(finalAt), officer: officers.head, note: escalationNote(severity, officers.head) })
  }
  return history
}

export function buildSeedComplaints(now = Date.now()): Complaint[] {
  return ROWS.map((row) => {
    const [seq, category, title, ward, status, ago, took, severity, supporters, lat, lng, landmark, description] = row
    const filedMs = now - ago * DAY
    const history = buildHistory(row, filedMs, now)
    const resolvedEvent = history.find((e) => e.status === 'resolved')
    return {
      id: `FMC-2026-${String(seq).padStart(6, '0')}`,
      category,
      title,
      ward,
      city: 'Bhagalpur',
      status,
      filedOn: new Date(filedMs).toISOString().slice(0, 10),
      filedAt: new Date(filedMs).toISOString(),
      resolvedOn: resolvedEvent?.at.slice(0, 10),
      department: DEPARTMENT_BY_CATEGORY[category],
      daysToResolve: status === 'resolved' ? took : undefined,
      location: { lat, lng },
      landmark,
      description: description ?? `${title}. ${CATEGORY_SENTENCE[category]}`,
      severity,
      supporters,
      history,
    }
  })
}
