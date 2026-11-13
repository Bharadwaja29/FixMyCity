import type { ComplaintCategory, Officer, Severity } from './api'

export const LEDGER_DEPARTMENTS = [
  'Roads',
  'Electricity',
  'Water Supply',
  'Sanitation',
  'Schools',
  'Hospitals',
  'Hostel/Food Safety',
] as const

export type LedgerDepartment = (typeof LEDGER_DEPARTMENTS)[number]

export const CATEGORY_LEDGER_DEPARTMENT: Record<ComplaintCategory, LedgerDepartment> = {
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

export const DEPARTMENT_BY_CATEGORY: Record<ComplaintCategory, string> = {
  Pothole: 'Public Works Department',
  Streetlight: 'Electrical Division',
  Garbage: 'Sanitation Department',
  Drainage: 'Drainage Cell',
  'Water Supply': 'Water Works',
  Encroachment: 'Enforcement Wing',
  'School Facilities': 'Education Department',
  'Hospital Services': 'Health Department',
  'Food Safety': 'Food Safety Cell',
}

export const PHOTO_BY_CATEGORY: Record<ComplaintCategory, string> = {
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

/** Mock officers. Names are invented for the demo and do not refer to real people. */
export const OFFICERS: Record<LedgerDepartment, { assign: Officer; field: Officer; head: Officer }> = {
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

export const INTAKE_OFFICER: Officer = { name: 'FixMyCity intake desk', role: 'Automated triage and duplicate check' }

interface StageNotes {
  assigned: string
  progress: string
  resolved: string
}

export const STAGE_NOTES: Record<ComplaintCategory, StageNotes> = {
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

export function escalationNote(severity: Severity | undefined, head: Officer): string {
  const reason =
    severity === 'Critical'
      ? 'A critical-severity case was not actioned within 72 hours.'
      : 'The 7-day service window passed with no field action recorded.'
  return `${reason} Escalated to ${head.role} for direct review.`
}
