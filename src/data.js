export const BASELINE_DATE = '2026-08-15';
export const FOLLOWUP_DATE = '2026-09-15';
export const ASSESSMENT_NOTICE = 'The prototype uses illustrative data and categories. It does not estimate a calibrated probability of fire or expected financial loss.';
export const assessmentRules = Object.freeze({
  exposure: 'Environmental exposure and property mitigation are separate. Verified work never automatically changes surrounding exposure.',
  evidence: 'Evidence received is not evidence accepted. Unsupported conditions remain unassessed or limited.',
  verification: 'Verification confirms specific observable changes in reviewed evidence. It does not establish a reduction in future losses.',
  refresh: 'Demo assumption: evidence refresh needs are identified case by case pending expert review; original evidence dates remain visible.',
});
export const scheduleTemplate = [
  'Document baseline conditions and obtain contractor advice where needed.',
  'Address accessible combustible items and agreed near-building vegetation work.',
  'Complete planned work and capture follow-up evidence.',
  'Submit documentation and review unresolved items.',
];
const actions = [
  { id: 'A', title: 'Address vegetation near the building', fullTitle: 'Review and address combustible vegetation immediately adjacent to the building', priority: 'High', reason: 'Combustible material near the structure was observed in sample close-range photos.', required: 'Matching before/after close-range photos and reviewer check.', cost: 'Contractor quote may be needed', status: 'Recommended' },
  { id: 'B', title: 'Clear stored items from exterior walls', fullTitle: 'Remove combustible stored items from the exterior wall area', priority: 'High', reason: 'Combustible stored items were observed next to the building in a sample property photo.', required: 'Dated follow-up photo showing the same location.', cost: 'Owner may be able to complete', status: 'Recommended' },
  { id: 'C', title: 'Assess vegetation across the parcel', fullTitle: 'Assess vegetation continuity across the parcel', priority: 'Medium', reason: 'Surrounding vegetation may require a coordinated mitigation plan. Work must respect property boundaries and applicable requirements.', required: 'Site assessment and updated evidence.', cost: 'Professional assessment required', status: 'Recommended' },
  { id: 'D', title: 'Obtain roof and vent documentation', fullTitle: 'Obtain roof and vent documentation', priority: 'Review needed', reason: 'Construction details cannot be established from current imagery. Aerial images cannot verify roof or vent specifications.', required: 'Construction documentation or qualified inspection.', cost: 'Professional assessment may be required', status: 'Recommended' },
];
const specs = [
  ['oakridge', 'Oakridge House', 38.48, -122.69, 82, 'Action needed', 'Single-family home'],
  ['cedar', 'Cedar Grove Home', 38.46, -122.72, 67, 'Plan in progress', 'Single-family home'],
  ['valley', 'Valley View Residence', 38.44, -122.65, 45, 'Evidence pending', 'Single-family home'],
  ['meadow', 'Meadow Lane Home', 38.42, -122.73, 28, 'Monitoring', 'Single-family home'],
  ['ridgeway', 'Ridgeway Lodge', 38.50, -122.63, 74, 'Action needed', 'Small commercial property'],
];
const observations = {
  oakridge: [
    ['Combustible vegetation near the structure', 'Sample close-range property photos', 'Visible in provided evidence', 'condition', 'A'],
    ['Continuous vegetation in the surrounding area', 'Illustrative aerial context', 'Context identified; vegetation condition not fully verified', 'context', 'C'],
    ['Combustible items adjacent to an exterior wall', 'Sample property photo', 'Visible in provided evidence', 'condition', 'B'],
  ],
  cedar: [
    ['Dense shrubs beside the entry deck', 'Sample close-range property illustration', 'Visible in provided evidence', 'condition', 'A'],
    ['Tree canopy continues beyond the parcel', 'Illustrative aerial context', 'Context identified; condition not fully verified', 'context', 'C'],
  ],
  valley: [
    ['Owner reports exterior storage was cleared', 'Fictional owner evidence submission', 'Submitted — review pending', 'condition', 'B'],
    ['Vegetation corridor east of the parcel', 'Illustrative aerial context', 'Requires site assessment', 'context', 'C'],
  ],
  meadow: [
    ['A clear strip is shown beside the building', 'Sample site observation record', 'Documented condition; not independently verified', 'condition', 'A'],
    ['Scattered vegetation beyond the parcel', 'Illustrative aerial context', 'Vegetation condition not fully verified', 'context', 'C'],
  ],
  ridgeway: [
    ['Vegetation meets the guest-building edge', 'Sample close-range property illustration', 'Visible in provided evidence', 'condition', 'A'],
    ['Stored materials beside the service wall', 'Sample property illustration', 'Visible in provided evidence', 'condition', 'B'],
    ['Connected vegetation on adjacent slopes', 'Illustrative aerial context', 'Coordinated site assessment needed', 'context', 'C'],
  ],
};
export function createInitialState() {
  return { version: 1, selected: 'oakridge', dirty: false, conversations: {}, properties: specs.map(([id, name, lat, lng, score, workflow, type]) => {
    const obs = observations[id].map(([title, source, status, kind, action], i) => ({ id: `${id}-obs-${i}`, title, source, status, kind, action }));
    const relevant = id === 'oakridge' || id === 'ridgeway' ? ['A','B','C','D'] : id === 'valley' ? ['B','C','D'] : ['A','C','D'];
    const exposureCategory = id === 'meadow' ? 'Lower' : id === 'valley' ? 'Moderate' : 'Elevated';
    return { id, name, lat, lng, score, baseline: score, workflow, type, location: 'Sonoma County, California', assessmentDate: BASELINE_DATE,
      exposureAssessment: { propertyId: id, category: exposureCategory, assessmentDate: BASELINE_DATE, geographicScope: 'Illustrative surrounding landscape context near this fictional property', sourceReferences: ['Illustrative aerial context', 'Sample geographic context'], drivers: ['Vegetation continuity beyond the parcel', 'Illustrative landscape context'], limitations: 'Sample overlays only. Not an official hazard map or validated model.', assessmentMethod: 'Seeded illustrative category', isIllustrative: true, reviewStatus: 'Reviewed for demo' },
      observations: obs.map(o => ({ ...o, propertyId: id, propertyArea: o.action === 'A' ? 'Near building' : o.action === 'B' ? 'Exterior wall area' : 'Surrounding parcel context', observedAt: BASELINE_DATE, limitations: o.kind === 'context' ? 'Context does not verify small construction details.' : 'Based on available sample evidence.', findingStatus: o.kind === 'context' ? 'Additional evidence needed' : o.status.includes('Submitted') ? 'Additional evidence needed' : 'Observed concern' })), actions: actions.filter(a => relevant.includes(a.id)).map(a => ({ ...a, propertyId: id, rationale: a.reason, requiredEvidence: a.required, submittedEvidenceIds: [], verificationRecordId: null, reason: a.id === 'D' ? a.reason : `${obs.find(o => o.action === a.id)?.title || a.reason}. ${a.id === 'C' ? 'Work must respect property boundaries and applicable requirements.' : 'Document the condition and obtain advice where needed.'}`, owner: 'Property owner', target: '', note: '', status: id === 'cedar' && a.id === 'A' ? 'In progress' : id === 'valley' && a.id === 'B' ? 'Evidence submitted' : a.status })),
      evidence: obs.map((o, i) => ({ id: `${id}-evidence-${i}`, name: o.title, source: o.source, action: o.action, date: BASELINE_DATE, status: id === 'valley' && o.action === 'B' ? 'Submitted — review pending' : 'Baseline sample', prepared: false })),
      verification: 'Not reviewed', verificationRecords: [], correctionRequests: [], history: [], reports: [], schedule: null, budget: '', prepared: false,
    };
  }) };
}
export const category = score => score < 40 ? 'Lower' : score < 60 ? 'Moderate' : 'Elevated';
export const exposureCategory = p => p.exposureAssessment?.category || 'Not assessed';
export const evidenceCoverage = p => ({ label: 'Partial', scope: 'Observable property conditions and current mitigation evidence', received: p.evidence.length, reviewed: p.evidence.filter(e => e.status === 'Verified in demo' || e.status === 'Baseline sample').length, outstanding: ['Wider vegetation assessment', 'Roof and vent specifications'], professionalInspection: ['Roof and vent specifications'] });
export const verifiedCount = p => p.actions.filter(a => a.status === 'Verified in demo').length;
export const pendingReview = p => p.evidence.some(e => e.status === 'Submitted — review pending' || e.status === 'Prepared — review pending');
export const summary = properties => ({ total: properties.length, elevated: properties.filter(p => exposureCategory(p) === 'Elevated').length, pending: properties.filter(pendingReview).length, verified: properties.filter(p => verifiedCount(p) > 0).length, incomplete: properties.filter(p => evidenceCoverage(p).label !== 'Sufficient for the stated assessment scope').length });
export const unresolved = p => p.actions.filter(a => a.status !== 'Verified in demo');
export const observationResolved = (p, observation) => p.actions.some(action => action.id === observation.action && action.status === 'Verified in demo');
export function refreshWorkflow(p) {
  p.workflow = verifiedCount(p) ? 'Follow-up needed' : pendingReview(p) ? 'Evidence pending' : p.actions.some(a => a.status !== 'Recommended') ? 'Plan in progress' : 'Action needed';
}
export const priorityActions = p => p.actions.filter(a => a.priority === 'High');
export const ownerDone = a => ['Owner marked complete', 'Evidence submitted', 'Verified in demo'].includes(a.status);
export function useRecommendedPlan(p) {
  p.actions.forEach(a => { if (a.status === 'Recommended') a.status = 'Planned'; });
  refreshWorkflow(p);
}
export function startWork(p) {
  useRecommendedPlan(p);
  priorityActions(p).forEach(a => { if (a.status === 'Planned') a.status = 'In progress'; });
  refreshWorkflow(p);
}
export function markOwnerComplete(p, actionId) {
  const action = p.actions.find(a => a.id === actionId);
  if (!action || !['Planned', 'In progress'].includes(action.status)) return false;
  action.status = 'Owner marked complete';
  refreshWorkflow(p);
  return true;
}
export function loadPrepared(p) {
  if (p.id !== 'oakridge' || p.prepared || p.verification === 'Verified in demo') return false;
  p.prepared = true;
  for (const id of ['A', 'B']) {
    p.evidence.push({ id: `prepared-${id}`, name: id === 'A' ? 'Near-building vegetation changed' : 'Combustible stored items removed', source: 'Prepared synthetic before/after illustration', action: id, date: FOLLOWUP_DATE, status: 'Prepared — review pending', prepared: true });
    p.actions.find(a => a.id === id).status = 'Evidence submitted';
  }
  p.workflow = 'Evidence pending';
  return true;
}
export function applyReview(p) {
  if (p.id !== 'oakridge' || !p.prepared || p.verification === 'Verified in demo') return false;
  for (const a of p.actions) if (['A', 'B'].includes(a.id)) a.status = 'Verified in demo';
  for (const e of p.evidence) if (e.prepared) e.status = 'Verified in demo';
  for (const o of p.observations) if (['A', 'B'].includes(o.action)) o.findingStatus = 'Change verified';
  p.actions.filter(a => ['A','B'].includes(a.id)).forEach(a => { a.verificationRecordId = `verification-${a.id}`; a.submittedEvidenceIds = [`prepared-${a.id}`]; });
  p.verificationRecords.push(...['A','B'].map(id => ({ id: `verification-${id}`, actionId: id, reviewedAt: FOLLOWUP_DATE, reviewMethod: 'Simulated human operator review using prepared demonstration evidence', result: 'Change verified', evidenceIds: [`prepared-${id}`], reviewerType: 'Demo operator', limitations: 'Specific observable change only.', isSimulated: true })));
  p.assessmentDate = FOLLOWUP_DATE; p.workflow = 'Follow-up needed'; p.verification = 'Verified in demo';
  p.history.push({ date: FOLLOWUP_DATE, text: 'Simulated review of prepared evidence: vegetation change and stored-item removal confirmed. Wider vegetation and roof/vent details unresolved.' });
  p.reports.push({ id: 'oakridge-mitigation-2026-09-15', date: FOLLOWUP_DATE });
  return true;
}
export function reportSummary(p) {
  return { title: 'TerraShield — Illustrative demonstration assessment report', fictionalRecord: true, property: p.name, id: p.id, approximateAnchor: [p.lat, p.lng], baselineDate: BASELINE_DATE, followupDate: FOLLOWUP_DATE, methodologyVersion: 'Demo methodology v1.0', exposureAssessment: p.exposureAssessment, findings: p.observations, mitigationSummary: { verified: verifiedCount(p), recommended: p.actions.length }, evidenceSummary: evidenceCoverage(p), verifiedChanges: p.actions.filter(a => a.status === 'Verified in demo').map(a => a.fullTitle), outstandingActions: unresolved(p).map(a => ({ title: a.fullTitle, requiredEvidence: a.required })), evidence: p.evidence.map(({ id, name, source, action, date, status }) => ({ id, name, source, action, date, status })), reviewMethod: 'Simulated human operator review using prepared demonstration evidence', isIllustrative: true, closingNote: 'This demonstration report documents sample evidence and an illustrative assessment. It does not certify the property, guarantee future safety, or determine insurance pricing or coverage.' };
}
export function requestCorrection(p, findingId, note) { const finding = p.observations.find(o => o.id === findingId); if (!finding || !note?.trim()) return false; finding.findingStatus = 'Review requested'; p.correctionRequests.push({ id: `correction-${crypto.randomUUID()}`, findingId, note: note.trim(), requestedAt: new Date().toISOString().slice(0,10), status: 'Review requested' }); return true; }
