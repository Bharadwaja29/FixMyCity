import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env.local if not already in env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const APP_TO_DB_CATEGORY = {
  Pothole: 'pothole',
  Streetlight: 'streetlight',
  Garbage: 'garbage',
  Drainage: 'drainage',
  'Water Supply': 'water_supply',
  Encroachment: 'encroachment',
  'School Facilities': 'school_facilities',
  'Hospital Services': 'hospital_services',
  'Food Safety': 'food_safety',
}

const CATEGORY_DEPARTMENT_ID = {
  Pothole: 1, // Roads
  Encroachment: 1, // Roads
  Streetlight: 2, // Electricity
  'Water Supply': 3, // Water Supply
  Garbage: 4, // Sanitation
  Drainage: 4, // Sanitation
  'School Facilities': 5, // Schools
  'Hospital Services': 6, // Hospitals
  'Food Safety': 7, // Hostel & Food Safety
}

const PHOTO_BY_CATEGORY = {
  Pothole: '/complaints/pothole.jpg',
  Streetlight: '/complaints/streetlight.jpg',
  Garbage: '/complaints/garbage.jpg',
  Drainage: '/complaints/drainage.jpg',
  'Water Supply': '/complaints/water-supply.jpg',
  Encroachment: '/complaints/encroachment.jpg',
  'School Facilities': '/complaints/school-facilities.jpg',
  'Hospital Services': '/complaints/hospital-services.jpg',
  'Food Safety': '/complaints/food-safety.jpg',
}

const OFFICERS = {
  Roads: {
    assign: { name: 'Sunita Kumari', role: 'Assistant Engineer, PWD Roads Division' },
    field: { name: 'Rakesh Kumar Yadav', role: 'Junior Engineer, PWD Roads Division' },
    head: { name: 'Anil Prasad Singh', role: 'Executive Engineer, PWD Bhagalpur' },
  },
  Electricity: {
    assign: { name: 'Pankaj Mishra', role: 'Assistant Electrical Engineer' },
    field: { name: 'Imtiaz Alam', role: 'Lineman Supervisor, Electrical Division' },
    head: { name: 'Ravi Shankar Jha', role: 'Executive Engineer (Electrical)' },
  },
  'Water Supply': {
    assign: { name: 'Neha Sinha', role: 'Assistant Engineer, Water Works' },
    field: { name: 'Dinesh Paswan', role: 'Pipeline Supervisor, Water Works' },
    head: { name: 'Kamal Kishore Roy', role: 'Executive Engineer, Water Works' },
  },
  Sanitation: {
    assign: { name: 'Poonam Kumari', role: 'Sanitary Inspector, Ward Office' },
    field: { name: 'Suresh Ram', role: 'Sanitation Supervisor' },
    head: { name: 'Dr. Arvind Kumar', role: 'Health Officer, Municipal Corporation' },
  },
  Schools: {
    assign: { name: 'Meena Kumari', role: 'Block Resource Coordinator, Education' },
    field: { name: 'Prakash Chandra', role: 'Junior Engineer (Civil), Education Cell' },
    head: { name: 'Sanjay Verma', role: 'District Education Officer' },
  },
  Hospitals: {
    assign: { name: 'Dr. Shabana Parveen', role: 'Deputy Superintendent, District Hospital' },
    field: { name: 'Ajay Kumar Thakur', role: 'Hospital Administrator' },
    head: { name: 'Dr. R. K. Choudhary', role: 'Civil Surgeon' },
  },
  'Hostel/Food Safety': {
    assign: { name: 'Vikash Anand', role: 'Food Safety Officer' },
    field: { name: 'Mohit Raj', role: 'Food Safety Inspector' },
    head: { name: 'Alok Ranjan', role: 'Designated Officer, District Food Safety' },
  },
}

const CATEGORY_LEDGER_DEPARTMENT = {
  Pothole: 'Roads',
  Encroachment: 'Roads',
  Streetlight: 'Electricity',
  'Water Supply': 'Water Supply',
  Garbage: 'Sanitation',
  Drainage: 'Sanitation',
  'School Facilities': 'Schools',
  'Hospital Services': 'Hospitals',
  'Food Safety': 'Hostel/Food Safety',
}

const INTAKE_OFFICER = {
  name: 'FixMyCity intake desk',
  role: 'Automated triage and duplicate check',
}

const STAGE_NOTES = {
  Pothole: {
    assigned: 'Site inspection scheduled. Patch size and bitumen quantity to be estimated.',
    progress: 'Crew mobilised. Loose material cleared and the pothole prepared for patching.',
    resolved: 'Pothole filled and compacted. Completion photo uploaded to the case file.',
  },
  Streetlight: {
    assigned: 'Pole number identified from the pin. Electrical crew allotted.',
    progress: 'Fault traced to the lamp circuit. Replacement parts requisitioned.',
    resolved: 'Lamp and fitting replaced. Night inspection confirmed the light is on.',
  },
  Garbage: {
    assigned: 'Ward sanitation team notified. Extra pickup added to the route.',
    progress: 'Collection vehicle dispatched. Waste being lifted and the spot disinfected.',
    resolved: 'Waste cleared and the spot sanitised. Ward supervisor verified on site.',
  },
  Drainage: {
    assigned: 'Drain section marked for desilting. Jetting machine requested.',
    progress: 'Desilting under way. Blockage identified at the culvert joint.',
    resolved: 'Drain cleared and flow tested. Silt removed from the site.',
  },
  'Water Supply': {
    assigned: 'Valve zone identified. Pipeline team allotted for inspection.',
    progress: 'Supply to the section isolated. Joint repair in progress.',
    resolved: 'Leak sealed and supply restored. Pressure checked at the nearest tap.',
  },
  Encroachment: {
    assigned: 'Enforcement wing notified. Notice to occupants being prepared.',
    progress: 'Notice served to occupants. Removal drive scheduled with police support.',
    resolved: 'Obstruction removed and footpath cleared. Follow-up patrol assigned.',
  },
  'School Facilities': {
    assigned: 'Block office informed. Headmaster contacted for a damage assessment.',
    progress: 'Repair estimate approved. Contractor engaged for the work.',
    resolved: 'Repair completed and accepted by the headmaster.',
  },
  'Hospital Services': {
    assigned: 'Hospital administration notified. Duty manager asked to report back.',
    progress: 'Corrective steps under way. Staff roster and housekeeping changes ordered.',
    resolved: 'Issue corrected. Matter reviewed with the hospital administrator.',
  },
  'Food Safety': {
    assigned: 'Food safety inspector allotted. Inspection visit planned.',
    progress: 'Inspection carried out. Samples collected and the premises given a notice.',
    resolved: 'Compliance notice closed after a re-inspection found the issue corrected.',
  },
}

function escalationNote(severity, head) {
  const reason =
    severity === 'Critical'
      ? 'A critical-severity case was not actioned within 72 hours.'
      : 'The 7-day service window passed with no field action recorded.'
  return `${reason} Automatically escalated to ${head.name}, ${head.role}, for immediate intervention.`
}

const CATEGORY_SENTENCE = {
  Pothole: 'The damaged surface is a hazard for two-wheelers and pedestrians.',
  Streetlight: 'The area is unsafe after dark.',
  Garbage: 'Waste has been left uncollected and is attracting strays.',
  Drainage: 'Dirty water is standing in the lane and entering nearby homes.',
  'Water Supply': 'Households in the lane are affected.',
  Encroachment: 'Pedestrians are being forced onto the carriageway.',
  'School Facilities': 'Students are affected every school day.',
  'Hospital Services': 'Patients and attendants are facing delays and discomfort.',
  'Food Safety': 'Residents are at risk of food-borne illness.',
}

const HOUR = 3600000
const DAY = 24 * HOUR

const ROWS = [
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

function computePriority(severity, daysOpen, supporters, status) {
  if (status === 'resolved') return 10
  const sevW = { Critical: 45, High: 30, Medium: 16, Low: 6 }
  const base = sevW[severity] || 16
  const targetDays = { Critical: 2, High: 4, Medium: 7, Low: 14 }[severity] || 7
  const remaining = targetDays - daysOpen
  let urgency = 0
  if (remaining < 0) urgency = Math.min(30, 15 + Math.abs(remaining) * 4)
  else if (remaining === 0) urgency = 12
  else if (remaining <= 2) urgency = 6

  const suppScore = Math.min(18, Math.round(Math.log2(supporters + 1) * 3.2))
  const stScore = { escalated: 15, received: 6, assigned: 3, in_progress: 2, resolved: 0 }[status] || 0
  return Math.max(1, Math.min(99, base + urgency + suppScore + stScore))
}

function buildHistory(row, filedMs, now) {
  const [, category, , , status, ago, took, severity] = row
  const dept = CATEGORY_LEDGER_DEPARTMENT[category]
  const officers = OFFICERS[dept]
  const notes = STAGE_NOTES[category]
  const iso = (ms) => new Date(ms).toISOString()

  const history = [
    {
      status: 'received',
      at: iso(filedMs),
      officer: INTAKE_OFFICER,
      note: `Complaint logged. Photo classified as ${category.toLowerCase()}; no duplicate found within 600 m.`,
    },
  ]
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

  history.push({
    status: 'assigned',
    at: iso(assignedAt),
    officer: officers.assign,
    note: notes.assigned,
  })
  if (status === 'assigned') return history

  history.push({
    status: 'in_progress',
    at: iso(progressAt),
    officer: officers.field,
    note: notes.progress,
  })
  if (status === 'in_progress') return history

  if (status === 'resolved') {
    history.push({
      status: 'resolved',
      at: iso(finalAt),
      officer: officers.field,
      note: notes.resolved,
    })
  } else {
    history.push({
      status: 'escalated',
      at: iso(finalAt),
      officer: officers.head,
      note: escalationNote(severity, officers.head),
    })
  }
  return history
}

async function runSeed() {
  console.log('--- Starting Supabase Seed ---')
  console.log(`Connecting to: ${supabaseUrl}`)

  // Clean existing seed complaints if any
  const { data: existing } = await supabase.from('complaints').select('id, case_id')
  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing complaints. Cleaning up before seed...`)
    await supabase.from('complaint_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const now = Date.now()
  let insertedCount = 0
  let updatesCount = 0

  for (const row of ROWS) {
    const [seq, category, title, ward, status, ago, took, severity, supporters, lat, lng, landmark, description] = row
    const caseId = `FMC-2026-${String(seq).padStart(6, '0')}`
    const filedMs = now - ago * DAY
    const filedAt = new Date(filedMs).toISOString()
    const history = buildHistory(row, filedMs, now)
    const resolvedEvent = history.find((e) => e.status === 'resolved')
    const daysOpen = Math.max(0, Math.floor(((resolvedEvent ? Date.parse(resolvedEvent.at) : now) - filedMs) / DAY))
    const priorityScore = computePriority(severity, daysOpen, supporters, status)
    const dbCategory = APP_TO_DB_CATEGORY[category]
    const deptId = CATEGORY_DEPARTMENT_ID[category]
    const targetDays = { Critical: 2, High: 4, Medium: 7, Low: 14 }[severity] || 7
    const slaDueAt = new Date(filedMs + targetDays * DAY).toISOString()

    const complaintRow = {
      case_id: caseId,
      title,
      description: description || `${title}. ${CATEGORY_SENTENCE[category] || ''}`,
      category: dbCategory,
      department_id: deptId,
      severity,
      status,
      ward,
      landmark,
      lat,
      lng,
      image_urls: [PHOTO_BY_CATEGORY[category]],
      ai_category: dbCategory,
      ai_confidence: 0.86,
      ai_severity: severity,
      ai_model_version: 'civic-vit-mock-0.3',
      priority_score: priorityScore,
      supporter_count: supporters,
      sla_due_at: slaDueAt,
      created_at: filedAt,
      updated_at: filedAt,
      resolved_at: resolvedEvent ? resolvedEvent.at : null,
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('complaints')
      .insert(complaintRow)
      .select('id, case_id')
      .single()

    if (insertErr || !inserted) {
      console.error(`Failed to insert complaint ${caseId}:`, insertErr)
      continue
    }

    insertedCount++

    // Insert timeline updates
    const updatesRows = history.map((e) => ({
      complaint_id: inserted.id,
      status: e.status,
      note: e.note,
      officer_name: e.officer ? `${e.officer.name}, ${e.officer.role}` : 'System',
      created_at: e.at,
    }))

    const { error: updErr } = await supabase.from('complaint_updates').insert(updatesRows)
    if (updErr) {
      console.error(`Failed to insert updates for ${caseId}:`, updErr)
    } else {
      updatesCount += updatesRows.length
    }
  }

  console.log(`Successfully seeded ${insertedCount} complaints and ${updatesCount} updates into Supabase!`)
}

runSeed().catch((err) => {
  console.error('Fatal error seeding Supabase:', err)
  process.exit(1)
})
