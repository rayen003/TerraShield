import { icon, escape as e } from './icons.js';
import { category, verifiedCount, observationResolved, unresolved, priorityActions, ownerDone, BASELINE_DATE, FOLLOWUP_DATE } from './data.js';
import { houseIllustration } from './illustrations.js';
import { phaseFor } from './phases.js';

const date = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const badge = (label, tone = '') => `<span class="badge ${tone}">${e(label)}</span>`;
const button = (label, action, cls = 'primary', symbol = 'arrow') => `<button type="button" class="button ${cls}" data-action="${action}">${symbol ? icon(symbol) : ''}${e(label)}</button>`;
const compactTitles = { A: 'Vegetation close to the home', B: 'Stored items beside the wall', C: 'Connected surrounding vegetation' };
const actionTitles = { A: 'Address near-building vegetation', B: 'Clear items beside the wall', C: 'Assess wider vegetation', D: 'Check roof & vent details' };
const workInstructions = { A: 'Review vegetation beside the building and arrange appropriate work. Get qualified advice where needed.', B: 'Move accessible combustible items away from the exterior wall. Capture a matching after photo.' };
const statusLabel = a => a.status === 'Owner marked complete' ? 'Done by owner · not verified' : a.status;
function actionStatus(a) {
  if (a.status === 'Verified in demo') return ['Done', 'done'];
  if (a.status === 'Owner marked complete') return ['Done by owner', 'progress'];
  if (a.status === 'Evidence submitted') return ['In review', 'review'];
  if (a.status === 'In progress') return ['In progress', 'progress'];
  if (a.priority === 'High') return ['Critical', 'critical'];
  if (a.priority === 'Review needed') return ['Needs review', 'review'];
  return ['Pending', 'pending'];
}
const statusChip = (label, tone) => `<span class="status-chip ${tone}">${e(label)}</span>`;
function threatAsset(p, o) {
  const hasBundledAsset = p.id === 'oakridge' && ['A', 'B'].includes(o.action);
  const visual = hasBundledAsset ? `<span class="asset-art">${houseIllustration(false)}</span>` : `<span class="asset-art context-art"><i></i><i></i><i></i></span>`;
  const title = hasBundledAsset ? `Synthetic baseline illustration · ${o.action === 'A' ? 'near-building area' : 'wall area'}` : o.action === 'C' ? 'Illustrative parcel context' : 'Observation record';
  return `<button type="button" class="evidence-asset" data-action="evidence-${o.action}">${visual}<span><strong>${title}</strong><small>${e(o.source)} · ${date(BASELINE_DATE)}</small><em>Open evidence</em></span>${icon('chevron')}</button>`;
}

function footer(label, action, hint = '') {
  return `<div class="guided-footer">${button(label, action, 'primary full')}${hint ? `<p>${e(hint)}</p>` : ''}</div>`;
}
function disclosure(title, content, cls = '') {
  return `<details class="disclosure ${cls}"><summary><span>${title}</span>${icon('chevron')}</summary><div class="disclosure-content">${content}</div></details>`;
}
export function overview(p) {
  const reviewed = verifiedCount(p) > 0;
  return `<div class="compact-score ${category(p.score).toLowerCase()}">
    <div><span class="score-label">Illustrative risk index ${button('About score', 'score-info', 'score-help', 'info')}</span><span class="score-value">${p.score}<small>/100</small></span></div>
    <div class="compact-score-context">${badge(category(p.score), category(p.score).toLowerCase())}<span>${reviewed ? 'Baseline 82 → updated 58' : 'Start with conditions near your home'}</span><small>${date(p.assessmentDate)}</small></div>
  </div>
  <div class="section-title"><h3>${reviewed ? 'What changed & what remains' : 'What needs attention'}</h3><span>Click to expand</span></div>
  <div class="threat-tickets">${p.observations.map(o => {
    const resolved = observationResolved(p, o);
    const title = p.id === 'oakridge' ? compactTitles[o.action] : o.title;
    const a = p.actions.find(a => a.id === o.action);
    const [label, tone] = resolved ? ['Done', 'done'] : actionStatus(a);
    return `<details class="observation threat-ticket"><summary>
      <span class="ticket-icon ${resolved || o.kind === 'context' ? 'sage-bg' : 'rose-bg'}">${icon(resolved ? 'check' : o.action === 'B' ? 'box' : 'tree')}</span>
      <span class="ticket-summary"><strong>${e(title)}</strong>${statusChip(label, tone)}</span>${icon('chevron')}
      </summary><div class="ticket-detail"><p>${e(o.title)}</p>${threatAsset(p, o)}<div class="ticket-fact"><span>What this proves</span><p>${o.kind === 'context' ? 'Vegetation context around the parcel. It does not verify small construction details.' : p.id === 'oakridge' ? 'This condition was visible in a bundled synthetic baseline illustration.' : 'This record summarizes the property observation; no matching image asset is bundled for this fictional record.'}</p></div>
      <div class="ticket-fact"><span>${resolved ? 'Follow-up review' : 'What we know'}</span><p>${resolved ? 'Change verified from prepared Sep 15 evidence. Baseline observation retained for comparison.' : e(o.status)}</p></div>
      ${a ? `<div class="ticket-fact"><span>Recommended action</span><p>${e(a.fullTitle)}</p></div>` : ''}
      ${button('View supporting evidence', `evidence-${o.action}`, 'secondary', 'camera')}</div></details>`;
  }).join('')}</div>
  ${disclosure(`${icon('info')} Evidence coverage: Partial`, `<p>Roof and vent specifications have not been verified. ${reviewed ? 'Wider vegetation assessment remains outstanding.' : 'Open a threat card to see its evidence source.'}</p>`, 'compact-gap')}
  ${footer(reviewed ? 'View mitigation report' : 'Review action plan', reviewed ? 'open-report' : 'open-plan', reviewed ? 'Remaining exposure and evidence gaps still apply.' : '')}`;
}

function actionDetails(a) {
  const statuses = a.status === 'Verified in demo' ? ['Verified in demo'] : ['Recommended', 'Planned', 'In progress', 'Owner marked complete', 'Evidence submitted', 'Needs additional evidence'];
  return `<div class="ticket-detail"><div class="ticket-fact"><span>Why this action</span><p>${e(a.reason)}</p></div>
    <div class="ticket-fact"><span>Evidence needed</span><p>${e(a.required)}</p></div>
    <p class="cost-type">${e(a.cost)}</p>
    ${button('Open evidence', `evidence-${a.id}`, 'secondary', 'camera')}
    ${disclosure('Assignee, date & notes <span class="optional-label">Optional</span>', `<form data-form="action" data-id="${a.id}" class="action-form">
      <label>Responsible person<input name="owner" value="${e(a.owner)}" maxlength="100" placeholder="Property owner"></label>
      <label>Target date<input name="target" type="date" value="${e(a.target)}"></label>
      <label class="full-field">Status<select name="status" ${a.status === 'Verified in demo' ? 'disabled' : ''}>${statuses.map(s => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label class="full-field">Short note<textarea name="note" rows="3" maxlength="500" placeholder="Anything useful for this task…">${e(a.note)}</textarea></label>
      <p class="form-hint full-field">Owner completion is not verification.</p><button class="button secondary full-field" type="submit">Save action</button></form>`, 'action-options')}
    </div>`;
}
function actionTicket(a) {
  const [label, tone] = actionStatus(a);
  return `<details class="action-card" id="action-${a.id}"><summary><span class="action-check ${a.status === 'Verified in demo' ? 'done' : ''}">${a.status === 'Verified in demo' ? icon('check') : a.id}</span><span class="action-summary"><strong>${actionTitles[a.id] || e(a.title)}</strong><span>${statusChip(label, tone)}${badge(a.priority, a.priority === 'High' ? 'elevated' : 'amber')}</span></span>${icon('chevron')}</summary>${actionDetails(a)}</details>`;
}
export function actionPlan(p) {
  const priorities = priorityActions(p);
  const hasPlan = p.actions.some(a => a.status !== 'Recommended');
  const progressed = priorities.some(a => a.status !== 'Recommended' && a.status !== 'Planned');
  return `<div class="panel-intro"><div><h3>Start with ${priorities.length === 1 ? 'one priority' : 'these two priorities'}</h3><p>A ready-to-use plan. No forms to fill in.</p></div></div>
    <div class="action-list">${priorities.map(actionTicket).join('')}</div>
    ${disclosure(`Keep on the list <span class="disclosure-count">${p.actions.length - priorities.length}</span>`, `<p class="disclosure-intro">These still need assessment or documentation.</p>${p.actions.filter(a => a.priority !== 'High').map(actionTicket).join('')}`, 'remaining-actions')}
    ${footer(progressed ? 'Continue to work' : hasPlan ? 'Start work' : 'Use recommended plan', progressed ? 'open-act' : hasPlan ? 'start-work' : 'use-plan', hasPlan ? 'Next: work through the tasks, then add evidence.' : 'You can adjust people, dates, and notes later.')}
    ${disclosure('Schedule & budget <span class="optional-label">Optional</span>', `<div class="planning-box"><h3>Four-week planning template</h3><p>A starting point, not a guaranteed completion date.</p>${p.schedule ? `<form data-form="schedule">${p.schedule.map((week,i) => `<label class="week-label">Week ${i+1}<textarea name="week-${i}" rows="3" maxlength="500" required>${e(week)}</textarea></label>`).join('')}<button class="button secondary" type="submit">Save schedule</button></form>` : button('Create four-week plan','create-schedule','secondary','calendar')}</div>
    <form class="budget-box" data-form="budget"><h3>Planning budget</h3><p>No prices assumed. Obtain estimates before committing.</p><div class="budget-input"><label for="budget">Budget (USD)</label><div><span>$</span><input id="budget" name="budget" type="number" min="0" max="100000000" step="1" placeholder="Optional" value="${e(p.budget)}"><button class="button secondary" type="submit">Save</button></div></div><ul class="budget-guidance"><li>Stored items: owner may be able to complete</li><li>Vegetation work: contractor quote may be needed</li><li>Site and construction details: professional assessment</li></ul></form>`, 'planning-options')}`;
}
export function actView(p) {
  const priorities = priorityActions(p);
  const done = priorities.filter(ownerDone).length;
  const started = priorities.some(a => a.status !== 'Recommended' && a.status !== 'Planned');
  return `<div class="panel-intro"><div><h3>${done === priorities.length ? 'Ready to show the work' : 'Work through your priorities'}</h3><p>${done === priorities.length ? 'Next, add evidence for a separate review.' : 'Finish a task, then mark it done.'}</p></div></div>
    <div class="work-progress"><span>${done} of ${priorities.length} tasks done</span><span>Owner progress</span><progress value="${done}" max="${priorities.length}">${done} of ${priorities.length}</progress></div>
    <div class="work-list">${priorities.map(a => { const [label, tone] = actionStatus(a); return `<article class="work-card ${ownerDone(a) ? 'owner-done' : ''}" id="work-${a.id}"><div class="work-card-heading"><span class="ticket-icon sage-bg">${icon(ownerDone(a) ? 'check' : a.id === 'B' ? 'box' : 'tree')}</span><div><h3>${actionTitles[a.id]}</h3>${statusChip(label, tone)}</div></div>
      ${disclosure('Task details', `<p>${workInstructions[a.id] || e(a.reason)}</p><p><strong>Evidence to capture</strong><br>${e(a.required)}</p>${button('View evidence checklist', `evidence-${a.id}`, 'text-button', 'camera')}`)}
      ${!ownerDone(a) ? a.status === 'In progress' ? button('Mark work done', `owner-done-${a.id}`, 'secondary full', 'check') : button('Start task', `start-task-${a.id}`, 'secondary full', 'arrow') : ''}
    </article>`; }).join('')}</div>
    ${!started ? footer('Start work', 'start-work', 'No setup needed. You can add task details later.') : done === priorities.length ? footer('Continue to verification', 'open-evidence', 'Work marked done does not change the modeled score.') : p.id === 'oakridge' ? `<div class="demo-shortcut"><span>${icon('spark')} Presenting the demo?</span><p>Use the completed-work scenario for these two tasks.</p>${button('Mark demo work done', 'complete-demo-work', 'primary full', 'check')}<small>This records owner completion only. Nothing is verified yet.</small></div>` : '<p class="work-remaining">Finish the priority tasks above before moving to verification.</p>'}
    <p class="work-remaining">Wider vegetation and roof/vent details remain on the plan.</p>`;
}
export function comparison() {
  return `<div class="comparison"><figure><div class="image-label">Before · Aug 15</div>${houseIllustration(false)}<figcaption>Vegetation and stored items beside the house</figcaption></figure><figure><div class="image-label after">Prepared after · Sep 15</div>${houseIllustration(true)}<figcaption>Near-building strip cleared; stored items removed</figcaption></figure></div><p class="asset-caption">Matching synthetic illustrations of this fictional house.</p>`;
}
export function evidence(p) {
  const reviewed = verifiedCount(p) > 0;
  const main = p.id === 'oakridge' ? `${reviewed ? `<div class="review-success">${icon('check')}<div><strong>Two changes verified in demo</strong>${statusChip('Verified', 'done')}<p>Illustrative index: 82 → 58.</p><p>Wider vegetation and roof/vent details remain unresolved.</p></div></div>` : `<div class="panel-intro"><div><h3>Verify documented work</h3><p>Use prepared sample evidence for a separate review.</p>${statusChip(p.prepared ? 'Review pending' : 'Ready for review', p.prepared ? 'review' : 'pending')}</div></div>`}${comparison()}
    ${reviewed ? footer('View mitigation report','open-report') : p.prepared ? footer('Review prepared evidence','review-prepared','Sample evidence loaded. Score stays at 82 until review.') : footer('Load prepared demo evidence','load-prepared','Next: review the summary before applying the result.')}` : `<div class="panel-intro"><div><h3>Document your progress</h3><p>Add photos or documents for review.</p></div></div>${button('Open Oakridge scenario','select-oakridge','secondary','spark')}`;
  return `${main}
    ${disclosure(`${icon('upload')} Upload your own evidence`, `<form class="upload-box" data-form="upload"><label>Related action<select name="action" id="upload-action">${p.actions.map(a => `<option value="${a.id}">${e(a.title)}</option>`).join('')}</select></label><label class="file-drop">${icon('upload')}<strong>Choose an image or PDF</strong><span>Up to 15 MB · stays in your browser</span><input id="evidence-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" required></label><button class="button secondary full" type="submit">Submit evidence for review</button><p class="form-hint">Uploads stay review-pending. They never automatically change scores. File previews clear on reload.</p></form>`, 'upload-disclosure')}
    ${disclosure('Evidence checklist', `<div class="checklist">${p.actions.map(a => `<button data-action="evidence-${a.id}"><span class="checklist-status ${a.status === 'Verified in demo' ? 'done' : ''}">${icon(a.status === 'Verified in demo' ? 'check' : 'clock')}</span><span><strong>${e(a.title)}</strong><small>${e(a.status === 'Verified in demo' ? 'Prepared sample evidence reviewed' : a.required)}</small></span>${icon('chevron')}</button>`).join('')}</div>`)}
    ${disclosure(`Records & review history <span class="disclosure-count">${p.evidence.length}</span>`, `${p.evidence.map(record => `<button class="evidence-record" data-action="record-${record.id}"><span class="record-icon">${icon(record.upload ? 'upload' : 'camera')}</span><span><strong>${e(record.name)}</strong><small>${date(record.date)} · ${e(record.status)}</small><small>${e(record.source)}</small></span>${icon('chevron')}</button>`).join('')}<div class="history"><h3>Verification history</h3>${p.history.length ? p.history.map(h => `<p><strong>${date(h.date)}</strong><br>${e(h.text)}</p>`).join('') : '<p>No review completed yet.</p>'}</div>`)}
  `;
}
export function nextStep(p, tab) {
  const phase = phaseFor(tab);
  return `<div class="next-step"><div class="next-step-icon">${icon(phase.contextIcon)}</div><div><h3>${phase.contextTitle}</h3><p>${phase.contextDescription}</p></div></div>`;
}
