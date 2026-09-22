import './styles.css';
import './guided-workspace.css';
import { createInitialState, category, summary, unresolved, verifiedCount, pendingReview, loadPrepared, applyReview, reportSummary, BASELINE_DATE, FOLLOWUP_DATE, SCORE_DEFINITION, scheduleTemplate, useRecommendedPlan, startWork, markOwnerComplete, priorityActions, refreshWorkflow } from './data.js';
import { overview, actionPlan, actView, evidence, comparison, nextStep } from './workspace-ui.js';
import { propertyPhases } from './phases.js';
import { icon, escape as e } from './icons.js';
import { mountMap, destroyMap } from './map.js';
import { houseIllustration } from './illustrations.js';
import { prompts, answer } from './assistant.js';

const STORAGE_KEY = 'terrashield-demo-v1';
let storageWarning = '';
let state = readState();
let view = 'workspace', tab = 'overview', assistantOpen = false, propertyMenuOpen = false, search = '', filter = 'all', riskFilter = 'all';
const localFiles = new Map();
let toastTimeout;
const app = document.getElementById('app');
const current = () => state.properties.find(p => p.id === state.selected);
const date = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const badge = (text, tone = '') => `<span class="badge ${tone}">${e(text)}</span>`;
const riskBadge = p => badge(category(p.score), category(p.score).toLowerCase());
const btn = (label, action, cls = '', symbol = '') => `<button class="button ${cls}" data-action="${action}">${symbol ? icon(symbol) : ''}${label}</button>`;
function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.version === 1 && parsed.properties?.length === 5 && parsed.properties.every(p => Array.isArray(p.actions) && Array.isArray(p.evidence)) && parsed.properties.some(p => p.id === parsed.selected)) return parsed;
  } catch { storageWarning = 'Saved demo could not be loaded. A fresh session is ready.'; }
  return createInitialState();
}
function save(message) {
  state.dirty = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { storageWarning = 'Browser storage is unavailable. Changes remain available for this session.'; }
  if (message) toast(message);
}
function toast(message, error = false) {
  let node = document.getElementById('toast');
  if (!node) { node = document.createElement('div'); node.id = 'toast'; document.body.append(node); }
  node.className = `toast ${error ? 'error' : ''}`; node.setAttribute('role', error ? 'alert' : 'status'); node.textContent = message;
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => node.remove(), 4500);
}
function header() {
  return `<header class="app-header"><a href="#" class="brand" data-action="nav-workspace" aria-label="TerraShield home"><span class="brand-mark">${icon('shield')}</span>TerraShield<span class="brand-dot">®</span></a><nav aria-label="Main navigation">${[['workspace','home','Property workspace'],['portfolio','layers','Portfolio'],['reports','report','Reports']].map(([id,ic,title]) => `<button data-action="nav-${id}" class="nav-link ${view === id || view === 'report' && id === 'reports' ? 'active' : ''}">${icon(ic)}<span>${title}</span></button>`).join('')}</nav><div class="header-right">${badge('Illustrative demo','demo')}<button class="reset-button" data-action="reset">${icon('reset')}<span>Reset demo</span></button><span class="avatar" aria-label="Demo homeowner">JD</span></div></header>`;
}
function mapMarkup(portfolio = false) {
  return `<section class="map-card" aria-label="Interactive property map">
    <div id="property-map" tabindex="0" aria-label="Property map. Use arrow keys to pan and plus or minus to zoom."></div>
    <div class="map-heading"><span>${icon('pin')} ${portfolio ? 'Sonoma County portfolio' : 'Property & surroundings'}</span><span id="map-mode" role="status">Street basemap · loading</span></div>
    <div class="map-controls"><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="map-fit" aria-label="${portfolio ? 'Fit portfolio' : 'Fit to property'}" title="${portfolio ? 'Fit portfolio' : 'Fit to property'}">${icon('target')}</button></div>
    <span class="north-arrow" aria-hidden="true">N<br>↑</span>
    <details class="map-layers"><summary>${icon('layers')} Map layers</summary><div>
      ${[['boundary','Property boundary'],['vegetation','Surrounding vegetation'],['exposure','Exposure context'],['mitigation','Documented mitigation areas']].map(([id,label]) => `<label><input type="checkbox" data-layer="${id}" checked> ${label}</label>`).join('')}
      <label class="basemap-option"><input type="checkbox" id="street-map" checked> Street basemap (online)</label>
    </div></details>
    <div class="map-legend"><span><i class="legend-line"></i>Parcel</span><span><i class="legend-dot sage"></i>Vegetation</span><span><i class="legend-dot rose"></i>Exposure</span><span><i class="legend-dot amber"></i>Mitigation zone</span></div>
    <div class="map-footnote">Fictional parcels & overlays · Not an official hazard map</div>
  </section>`;
}
function propertySwitcher(p) {
  return `<div class="property-switcher">
    <button type="button" class="property-switcher-toggle" data-action="toggle-property-menu" aria-haspopup="listbox" aria-expanded="${propertyMenuOpen}" aria-controls="property-menu"><span>Switch property</span>${icon('chevron')}</button>
    ${propertyMenuOpen ? `<div id="property-menu" class="property-menu" role="listbox" aria-label="Select property">${state.properties.map(item => `<button type="button" class="property-menu-item ${item.id === p.id ? 'selected' : ''}" role="option" aria-selected="${item.id === p.id}" data-action="select-${item.id}"><span><strong>${e(item.name)}</strong><small>${e(item.type)} · ${item.score}/100</small></span>${badge(item.workflow, verifiedCount(item) ? 'sage' : 'amber')}</button>`).join('')}</div>` : ''}
  </div>`;
}
function workspace(p) {
  const contents = { overview, plan: actionPlan, act: actView, evidence };
  return `<main class="workspace-main">
    <div class="page-heading"><div><div class="breadcrumb">Your properties <span>/</span> Property workspace</div><h1>Your property, one step at a time.</h1><p>See the risks. Make a plan. Show your progress.</p></div>${btn('Ask TerraShield','assistant','assistant-trigger','spark')}</div>
    <div class="workspace-grid"><div class="map-column">${mapMarkup()}<div class="map-caption"><span>Fictional property records · Approximate locations</span></div>${nextStep(p, tab)}</div>
    <section class="property-panel" aria-label="Selected property details">
      <div class="property-header"><div class="property-kicker">${icon('home')} Fictional property record</div>
      <div class="property-name-row"><h2>${e(p.name)}</h2>${propertySwitcher(p)}</div>
      <p>${e(p.type)} · ${e(p.location)}</p>
      <div class="property-meta">${badge(p.workflow, verifiedCount(p) ? 'sage' : 'amber')}</div></div>
      <div class="tabs" role="tablist" aria-label="Property details">${propertyPhases.map(({ id, label }) => `<button id="tab-${id}" role="tab" aria-selected="${tab === id}" aria-controls="property-content" tabindex="${tab === id ? 0 : -1}" data-action="tab-${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}</div>
      <div id="property-content" class="panel-content" role="tabpanel" aria-labelledby="tab-${tab}">${contents[tab](p)}</div>
    </section></div>
    <footer class="page-footer"><span>Illustrative assessments. Documented progress.</span><span>${propertyPhases.map(({ footerLabel }) => footerLabel).join(' → ')} → Report</span></footer>
  </main>`;
}
function portfolio() {
  const s = summary(state.properties);
  return `<main><div class="page-heading"><div><div class="breadcrumb">TerraShield <span>/</span> Portfolio</div><h1>A wider view. The same attention to detail.</h1><p>Portfolio view illustrates future insurer and property-manager workflows.</p></div>${btn('Ask TerraShield','assistant','assistant-trigger','spark')}</div><div class="summary-grid">${[[s.total,'Properties monitored','home'],[s.elevated,'Elevated modeled category','alert'],[s.pending,'Awaiting evidence review','camera'],[s.verified,'With verified actions','shield']].map(([n,label,ic]) => `<div class="summary-card"><span>${label}</span>${icon(ic)}<strong>${n.toString().padStart(2,'0')}</strong></div>`).join('')}</div><div class="portfolio-map">${mapMarkup(true)}</div><section class="portfolio-table"><div class="table-toolbar"><div><h2>Property overview</h2><p>Five fictional properties. One shared workspace.</p></div><div class="filters"><label class="search-field">${icon('search')}<input id="property-search" type="search" placeholder="Search properties" value="${e(search)}" aria-label="Search properties"></label><select id="workflow-filter" aria-label="Filter workflow">${[['all','All properties'],['action','Action needed'],['pending','Evidence pending'],['verified','Verified actions present'],['gaps','Outstanding evidence gaps']].map(([id,label]) => `<option value="${id}" ${id === filter ? 'selected' : ''}>${label}</option>`).join('')}</select><select id="risk-filter" aria-label="Filter modeled category">${['all','Elevated','Moderate','Lower'].map(c => `<option value="${c}" ${c === riskFilter ? 'selected' : ''}>${c === 'all' ? 'All categories' : c}</option>`).join('')}</select></div></div><div id="table-results">${tableRows()}</div></section></main>`;
}
function tableRows() {
  const rows = state.properties.filter(p => `${p.name} ${p.type}`.toLowerCase().includes(search.toLowerCase()) && (riskFilter === 'all' || category(p.score) === riskFilter) && (filter === 'all' || filter === 'action' && p.workflow === 'Action needed' || filter === 'pending' && pendingReview(p) || filter === 'verified' && verifiedCount(p) > 0 || filter === 'gaps' && unresolved(p).length > 0));
  return `<div class="table-scroll"><table><thead><tr><th>Property</th><th>Property type</th><th>Modeled category & score</th><th>Workflow status</th><th>Verified actions</th><th>Latest assessment</th><th><span class="sr-only">Open property</span></th></tr></thead><tbody>${rows.map(p => `<tr><td><strong>${e(p.name)}</strong><small>Sonoma County, CA</small></td><td>${e(p.type)}</td><td>${riskBadge(p)} <strong>${p.score}</strong><span class="muted">/100</span></td><td>${e(p.workflow)}</td><td><span class="verified-cell">${icon(verifiedCount(p) ? 'check' : 'clock')}${verifiedCount(p)} of ${p.actions.length}</span></td><td>${date(p.assessmentDate)}</td><td>${btn('Open property',`select-${p.id}`,'text-button','arrow')}</td></tr>`).join('')}</tbody></table></div>${rows.length ? `<p class="table-count">${rows.length} of 5 properties · All modeled scores are illustrative</p>` : `<div class="empty-state"><h3>No matching properties</h3><p>Try a different search or clear your filters.</p>${btn('Clear filters','clear-filters','secondary')}</div>`}`;
}
function reports() {
  const ready = state.properties.filter(p => p.reports.length);
  return `<main><div class="page-heading"><div><div class="breadcrumb">TerraShield <span>/</span> Reports</div><h1>Progress you can put on paper.</h1><p>Document observable changes, supporting evidence, and what remains unresolved.</p></div>${btn('Ask TerraShield','assistant','assistant-trigger','spark')}</div><section class="reports-list">${ready.length ? ready.map(p => `<article class="report-list-card"><span class="report-card-icon">${icon('report')}</span><div>${badge('Illustrative demo report','sage')}<h2>${e(p.name)}</h2><p>Mitigation review · ${date(p.assessmentDate)}</p><p>Baseline ${p.baseline} → updated ${p.score} · ${verifiedCount(p)} sample changes verified</p></div>${btn('View mitigation report',`report-${p.id}`,'primary','arrow')}</article>`).join('') : `<div class="empty-state report-empty">${icon('report')}<h2>Your first report starts with documented progress.</h2><p>Complete the prepared Oakridge evidence review to create an illustrative mitigation report.</p>${btn('Explore Oakridge evidence','start-report','primary','camera')}</div>`}</section></main>`;
}
function report(p) {
  if (!p.reports.length) return reports();
  const r = reportSummary(p);
  const packet = p.insurancePacket;
  return `<main class="report-main"><div class="report-toolbar">${btn('Return to property','return-property','text-button','home')}<div>${btn('Download JSON','download-report','secondary','download')}${btn('Print / Save as PDF','print-report','primary','print')}</div></div><article class="report-document"><div class="report-brand"><span class="brand">${icon('shield')}TerraShield</span>${badge('Illustrative demo report','demo')}</div><div class="report-title"><div><p class="muted">Mitigation & evidence review</p><h1>${e(p.name)}</h1><p>Fictional property record · ${e(p.location)}</p></div><span class="report-seal">${icon('shield')}<strong>2 changes</strong><span>verified in demo</span></span></div><div class="report-dates"><div><span>Baseline assessment</span><strong>${date(BASELINE_DATE)}</strong></div><div><span>Prepared follow-up evidence</span><strong>${date(FOLLOWUP_DATE)}</strong></div><div><span>Follow-up assessment</span><strong>${date(p.assessmentDate)}</strong></div></div><section class="report-scores"><div><span>Baseline modeled index</span><strong>82<small>/100</small></strong>${badge('Elevated','elevated')}</div><span class="report-score-arrow">→</span><div><span>Updated modeled index</span><strong>58<small>/100</small></strong>${badge('Moderate','moderate')}</div><p>24-point index change.<br>Illustrative model recalculation after documented changes. Remaining exposure and evidence gaps still apply.</p></section><section class="insurance-packet ${packet ? 'approved' : ''}"><div><span class="packet-kicker">Owner-reviewed insurer packet</span><h2>${packet ? 'Packet ready for your review' : 'Make this ready for your insurer'}</h2><p>${packet ? `Owner details confirmed${packet.insurerName ? ` for ${e(packet.insurerName)}` : ''}. Review before opening email draft.` : 'TerraShield compiles verified changes, dates, evidence, score context, and remaining gaps. You control what happens next.'}</p></div><div class="packet-status">${packet ? statusIcon('check','Owner reviewed') : statusIcon('info','Owner review required')}</div>${packet ? btn('Prepare email to insurer','prepare-insurer-email','secondary','mail') : btn('Review insurance packet','review-insurance-packet','primary','shield')}</section><p class="report-definition">${SCORE_DEFINITION}</p><h2>Verified observable changes</h2><div class="report-changes"><p>${icon('check')}Near-building vegetation change confirmed in prepared sample evidence.</p><p>${icon('check')}Combustible stored items removed from the exterior wall area in prepared sample evidence.</p></div>${comparison()}<h2>Outstanding actions & evidence gaps</h2>${unresolved(p).map(a => `<div class="report-outstanding"><span>${icon('clock')}</span><div><strong>${e(a.fullTitle)}</strong><p>${e(a.required)}</p></div>${badge('Outstanding','amber')}</div>`).join('')}<p>Roof and vent specifications remain unverified. Aerial context does not establish small construction details.</p><h2>Evidence sources & dates</h2><table class="report-evidence-table"><thead><tr><th>Evidence</th><th>Source</th><th>Evidence date</th></tr></thead><tbody>${r.evidence.map(item => `<tr><td>${e(item.name)}<small>${e(item.status)}</small></td><td>${e(item.source)}</td><td>${date(item.date)}</td></tr>`).join('')}</tbody></table><h2>Review method</h2><p>Simulated review using prepared demonstration evidence. No computer-vision model was run. Only the two prepared observable changes are verified in this demo.</p><footer class="report-disclaimer">${e(r.closingNote)}</footer></article></main>`;
}
function statusIcon(name, label) { return `<span>${icon(name)}${e(label)}</span>`; }
function assistantMarkup(p) {
  const messages = state.conversations[p.id] || [];
  return `<aside class="assistant-drawer" aria-label="TerraShield Assistant"><div class="assistant-header"><span class="assistant-emblem">${icon('spark')}</span><div><h2>TerraShield Assistant</h2><span>Demo assistant</span></div><button class="icon-button" data-action="close-assistant" aria-label="Close assistant">${icon('close')}</button></div><div class="assistant-property">${icon('home')} ${e(p.name)} ${riskBadge(p)}</div><div class="assistant-scroll"><div class="assistant-welcome"><h3>A little clarity for your next step.</h3><p>I can help you understand this property, organize work, and prepare evidence.</p></div><div class="suggested-prompts">${prompts.map((prompt,i) => `<button data-action="prompt-${i}">${e(prompt)}${icon('chevron')}</button>`).join('')}</div><div class="messages" aria-live="polite">${messages.map(m => `<div class="message user">${e(m.question)}</div><div class="message assistant"><span class="message-byline">${icon('spark')} TerraShield</span><p>${e(m.response.text)}</p>${m.response.refs ? `<div class="assistant-refs">${m.response.refs.map(ref => btn(e(ref.label),`evidence-${ref.action}`,'text-button','camera')).join('')}</div>` : ''}${btn(e(m.response.label),`assistant-${m.response.action}`,'secondary')}${m.response.extra ? btn(e(m.response.extra.label),`assistant-${m.response.extra.action}`,'text-button') : ''}</div>`).join('')}</div></div><form class="assistant-input" data-form="chat"><label for="chat-input" class="sr-only">Ask about this property</label><div><input id="chat-input" name="question" placeholder="Ask about this property…" maxlength="600" required><button class="button primary" aria-label="Send question" type="submit">${icon('arrow')}</button></div><span>Grounded in sample records. Messages stay in this browser.</span></form></aside>`;
}
function render() {
  destroyMap();
  const p = current();
  document.title = `TerraShield — ${view === 'workspace' ? p.name : view === 'portfolio' ? 'Portfolio' : 'Reports'}`;
  app.innerHTML = `${header()}<div class="app-body ${assistantOpen ? 'with-assistant' : ''}">${view === 'workspace' ? workspace(p) : view === 'portfolio' ? portfolio() : view === 'report' ? report(p) : reports()}${storageWarning ? `<div class="storage-warning" role="status">${e(storageWarning)}</div>` : ''}</div>${assistantOpen ? assistantMarkup(p) : ''}<dialog id="modal" aria-labelledby="modal-title"></dialog>`;
  if (view === 'workspace' || view === 'portfolio') mountMap(state.properties, state.selected, view === 'portfolio', id => selectProperty(id, view === 'portfolio'));
}
function selectProperty(id, openWorkspace = true) {
  if (!state.properties.some(p => p.id === id)) return;
  state.selected = id; propertyMenuOpen = false; if (openWorkspace) view = 'workspace'; tab = 'overview'; save(); render();
}
function modal(title, body, footer = '') {
  const d = document.getElementById('modal');
  d.innerHTML = `<div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div><div class="modal-content">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ''}`;
  d.showModal();
}
function reviewModal() {
  modal('Review prepared sample evidence', `<p class="muted">Oakridge House · Evidence dated ${date(FOLLOWUP_DATE)}</p><div class="review-items"><p>${icon('check')}<span><strong>Near-building vegetation change</strong>Observable change confirmed in sample evidence</span></p><p>${icon('check')}<span><strong>Combustible stored items</strong>Removal confirmed in sample evidence</span></p><p>${icon('clock')}<span><strong>Wider vegetation assessment</strong>Outstanding</span></p><p>${icon('info')}<span><strong>Roof and vent specifications</strong>Still unverified</span></p></div><div class="review-preview"><span>Illustrative modeled index</span><strong>82 → 58</strong><p>24-point index change. Not a percentage change in fire probability or expected losses.</p></div><p class="form-hint">Simulated review of prepared demonstration evidence only. Arbitrary uploaded files are not analyzed or verified.</p>`, `${btn('Cancel','close-modal','secondary')}${btn('Apply simulated review result','apply-review','primary','check')}`);
}
function insurancePacketModal(p) {
  const saved = p.insurancePacket || {};
  modal('Review insurance packet', `<p class="muted">This packet is prepared from verified sample evidence. Nothing is sent automatically.</p><div class="packet-checklist"><p>${icon('check')}Property name, fictional-record label, baseline and updated modeled index</p><p>${icon('check')}Verified observable changes, matching prepared evidence, and evidence dates</p><p>${icon('check')}Outstanding actions and unverified roof/vent details</p><p>${icon('info')}Insurer decides acceptance, pricing, eligibility, and coverage</p></div><form data-form="insurance-packet" class="insurance-form"><label>Insurer or agent name <span>Optional</span><input name="insurerName" maxlength="100" value="${e(saved.insurerName)}" placeholder="Example Insurance Co."></label><label>Email address <span>Optional</span><input name="insurerEmail" type="email" maxlength="254" value="${e(saved.insurerEmail)}" placeholder="agent@example.com"></label><label class="packet-confirm"><input name="confirmed" type="checkbox" required ${saved.confirmed ? 'checked' : ''}><span>I reviewed this illustrative packet and want to prepare it for insurer review.</span></label><p class="form-hint">Preparing email creates a local draft only. You choose whether to send it from your own email client.</p><button class="button primary full" type="submit">Approve packet for sharing</button></form>`);
}
function insurerEmailDraft(p) {
  const recipient = p.insurancePacket?.insurerEmail || '';
  const name = p.insurancePacket?.insurerName ? ` ${p.insurancePacket.insurerName}` : '';
  const subject = `Mitigation evidence packet — ${p.name}`;
  const body = `Hello${name},\n\nI am sharing an illustrative TerraShield mitigation evidence packet for ${p.name}. It includes documented changes, evidence dates, an illustrative modeled assessment, and outstanding items for your review.\n\nPlease let me know if you need anything else.\n\nThank you`;
  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  toast('Email draft opened. Nothing was sent by TerraShield.');
}
function showEvidence(action) {
  const p = current(), a = p.actions.find(a => a.id === action);
  if (!a) return;
  const records = p.evidence.filter(r => r.action === action);
  modal(e(a.title), `<p><strong>Required evidence</strong><br>${e(a.required)}</p>${p.id === 'oakridge' && ['A','B'].includes(action) ? comparison() : ''}${records.length ? records.map(r => `<div class="modal-record"><strong>${e(r.name)}</strong><p>${e(r.source)}</p><p>${date(r.date)} · ${e(r.status)}</p></div>`).join('') : '<div class="evidence-gap">No evidence received for this action. Add documentation or qualified inspection evidence.</div>'}<p class="form-hint">${action === 'D' ? 'Roof and vent details cannot be verified from an aerial image.' : 'Evidence dates are distinct from assessment dates.'}</p>`, btn('Open Verify tab','open-evidence','primary','camera'));
}
function recordModal(id) {
  const record = current().evidence.find(r => r.id === id); if (!record) return;
  const file = localFiles.get(id);
  modal(e(record.name), `<p>${e(record.source)} · ${date(record.date)}</p>${badge(record.status,'blue')}<div class="file-preview">${file ? file.type === 'application/pdf' ? `<object data="${file.url}" type="application/pdf" aria-label="Local PDF preview"><a href="${file.url}" target="_blank" rel="noopener">Open local PDF</a></object><a href="${file.url}" target="_blank" rel="noopener">Open local PDF in a new tab</a>` : `<img src="${file.url}" alt="Locally submitted evidence preview">` : record.upload ? '<p>File contents were cleared when this page reloaded. The submission record remains; choose the file again to preview it. Review is still pending.</p>' : record.prepared ? houseIllustration(true) : current().id === 'oakridge' && ['A','B'].includes(record.action) ? houseIllustration(false) : '<p>This is an illustrative observation record. No underlying photograph is bundled for this property.</p>'}</div><p class="form-hint">${record.upload ? 'Submitted — review pending. This file has not been analyzed.' : 'Prepared synthetic sample content; not a real property photograph.'}</p>`);
}
function ask(question) {
  const p = current(); state.conversations[p.id] ||= [];
  state.conversations[p.id].push({ question, response: answer(question,p) });
  save(); render(); document.querySelector('.assistant-scroll')?.scrollTo(0,100000); document.getElementById('chat-input')?.focus();
}
function openTab(next) {
  view = 'workspace'; tab = next; render();
  const tabControl = document.getElementById(`tab-${next}`);
  tabControl?.focus({ preventScroll: true });
  if (tabControl && (tabControl.getBoundingClientRect().top < 0 || tabControl.getBoundingClientRect().top > innerHeight - 100)) tabControl.scrollIntoView({ block: 'start' });
}
app.addEventListener('click', event => {
  const control = event.target.closest('[data-action]'); if (!control) return;
  event.preventDefault();
  const action = control.dataset.action, p = current();
  if (action.startsWith('nav-')) { propertyMenuOpen = false; view = action.slice(4); render(); return; }
  if (action === 'toggle-property-menu') { propertyMenuOpen = !propertyMenuOpen; render(); document.querySelector('[data-action="toggle-property-menu"]')?.focus(); return; }
  if (action.startsWith('select-')) { selectProperty(action.slice(7)); return; }
  if (action.startsWith('tab-')) { openTab(action.slice(4)); return; }
  if (action.startsWith('evidence-')) { showEvidence(action.slice(9)); return; }
  if (action.startsWith('record-')) { recordModal(action.slice(7)); return; }
  if (action.startsWith('prompt-')) { ask(prompts[Number(action.slice(7))]); return; }
  if (action.startsWith('owner-done-')) {
    if (markOwnerComplete(p, action.slice(11))) { save('Work marked done by owner. Evidence review comes next.'); render(); }
    return;
  }
  if (action.startsWith('start-task-')) {
    const task = p.actions.find(a => a.id === action.slice(11));
    if (task && ['Recommended', 'Planned', 'Needs additional evidence'].includes(task.status)) { task.status = 'In progress'; refreshWorkflow(p); save('Task started.'); render(); }
    return;
  }
  if (action.startsWith('report-')) { state.selected = action.slice(7); view = 'report'; save(); render(); return; }
  if (action.startsWith('assistant-')) {
    const sub = action.slice(10);
    if (sub === 'apply-schedule') { p.schedule ||= [...scheduleTemplate]; useRecommendedPlan(p); save('Four-week plan applied. Schedule is optional and editable.'); openTab('plan'); document.querySelector('.planning-options').open = true; }
    else if (sub.startsWith('add-')) { const a = p.actions.find(a => a.id === sub.slice(4)); if (a && a.status === 'Recommended') { a.status='Planned'; p.workflow = pendingReview(p) ? 'Evidence pending' : 'Plan in progress'; save('Action added to plan.'); } openTab('plan'); }
    else if (sub === 'report') { view = p.reports.length ? 'report' : 'reports'; render(); }
    else openTab(sub === 'plan' ? 'plan' : 'evidence');
    return;
  }
  switch(action) {
    case 'open-plan': openTab('plan'); break;
    case 'open-act': openTab('act'); break;
    case 'use-plan': useRecommendedPlan(p); save('Plan ready. Start work when you are ready.'); render(); document.querySelector('[data-action="start-work"]')?.focus(); break;
    case 'start-work': startWork(p); save('Work started. Mark each task done when it is ready.'); openTab('act'); break;
    case 'complete-demo-work':
      if (p.id === 'oakridge') { priorityActions(p).forEach(a => markOwnerComplete(p, a.id)); save('Demo work marked done by owner. Nothing is verified yet.'); render(); document.querySelector('.guided-footer button')?.focus(); }
      break;
    case 'open-evidence': openTab('evidence'); break;
    case 'assistant': assistantOpen = true; render(); document.getElementById('chat-input')?.focus(); break;
    case 'close-assistant': assistantOpen = false; render(); document.querySelector('[data-action="assistant"]')?.focus(); break;
    case 'close-modal': document.getElementById('modal').close(); break;
    case 'score-info': modal('Understanding the modeled index', `<p>${SCORE_DEFINITION}</p><p>Demo categories: 0–39 Lower, 40–59 Moderate, 60–100 Elevated.</p><p>Evidence coverage is partial. Dates reflect individual records, not real-time updates.</p>`); break;
    case 'create-schedule': p.schedule ||= [...scheduleTemplate]; useRecommendedPlan(p); save('Four-week planning template created.'); render(); document.querySelector('.planning-options').open = true; break;
    case 'load-prepared': if (loadPrepared(p)) { save('Prepared demo evidence loaded. Review the summary before applying.'); render(); reviewModal(); } break;
    case 'review-prepared': reviewModal(); break;
    case 'apply-review': if (applyReview(p)) { save('Simulated review complete. Two changes verified; modeled index updated to 58.'); render(); } break;
    case 'open-report': if (p.reports.length) { view = 'report'; render(); } else toast('A report becomes available after the prepared review.'); break;
    case 'review-insurance-packet': insurancePacketModal(p); break;
    case 'prepare-insurer-email': insurerEmailDraft(p); break;
    case 'return-property': view='workspace'; tab='overview'; render(); break;
    case 'start-report': state.selected='oakridge'; view='workspace'; tab='evidence'; save(); render(); break;
    case 'print-report': window.print(); break;
    case 'download-report': {
      const url = URL.createObjectURL(new Blob([JSON.stringify(reportSummary(p),null,2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href=url; a.download=`terrashield-${p.id}-illustrative-report.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Structured report downloaded.'); break;
    }
    case 'clear-filters': search=''; filter='all'; riskFilter='all'; render(); break;
    case 'reset': if (state.dirty) modal('Reset this demo?', '<p>This restores all five original property records, the Oakridge score of 82, original plans and evidence, and an empty assistant conversation. Local uploads will be cleared.</p>', `${btn('Keep exploring','close-modal','secondary')}${btn('Reset demo','confirm-reset','primary','reset')}`); else resetDemo(); break;
    case 'confirm-reset': resetDemo(); break;
  }
});
function resetDemo() {
  localFiles.forEach(f => URL.revokeObjectURL(f.url)); localFiles.clear(); state = createInitialState();
  try { localStorage.removeItem(STORAGE_KEY); } catch { storageWarning = 'Browser storage could not be cleared. Current session has been reset.'; }
  view='workspace'; tab='overview'; assistantOpen=false; propertyMenuOpen=false; search=''; filter='all'; riskFilter='all'; render(); toast('Demo reset. Oakridge is back to its baseline.');
}
app.addEventListener('change', event => {
  if (event.target.id === 'workflow-filter') { filter=event.target.value; document.getElementById('table-results').innerHTML=tableRows(); }
  if (event.target.id === 'risk-filter') { riskFilter=event.target.value; document.getElementById('table-results').innerHTML=tableRows(); }
});
app.addEventListener('input', event => { if (event.target.id === 'property-search') { search=event.target.value; document.getElementById('table-results').innerHTML=tableRows(); } });
app.addEventListener('keydown', event => {
  if (event.key === 'Escape' && propertyMenuOpen && !document.getElementById('modal').open) { propertyMenuOpen=false; render(); document.querySelector('[data-action="toggle-property-menu"]')?.focus(); return; }
  if (event.key === 'Escape' && assistantOpen && !document.getElementById('modal').open) { assistantOpen=false; render(); document.querySelector('[data-action="assistant"]')?.focus(); }
  if (event.target.getAttribute('role') === 'tab' && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const tabs=propertyPhases.map(({ id }) => id); const idx=tabs.indexOf(tab); openTab(event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(idx+(event.key === 'ArrowRight' ? 1 : tabs.length-1))%tabs.length]); }
});
app.addEventListener('submit', event => {
  const form=event.target; if (!form.dataset.form) return; event.preventDefault(); const data = new FormData(form), p=current();
  switch(form.dataset.form) {
    case 'action': { const a=p.actions.find(a=>a.id===form.dataset.id); a.owner=data.get('owner').trim() || 'Property owner'; a.target=data.get('target'); a.note=data.get('note').trim(); if (a.status !== 'Verified in demo') a.status=data.get('status'); refreshWorkflow(p); save('Action changes saved.'); render(); const card=document.getElementById(`action-${a.id}`); card.open=true; card.querySelector('.action-options').open=true; const group=card.closest('.remaining-actions'); if(group) group.open=true; break; }
    case 'schedule': p.schedule=scheduleTemplate.map((_,i)=>data.get(`week-${i}`).trim()); save('Schedule saved.'); break;
    case 'budget': p.budget=data.get('budget'); save('Planning budget saved. Contractor estimates are still needed.'); break;
    case 'chat': { const q=data.get('question').trim(); if(q) ask(q); break; }
    case 'upload': {
      const file=data.get('file');
      if (!file || !file.size) { toast('Choose a nonempty image or PDF.',true); return; }
      if (!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(file.type)) { toast('Unsupported file. Choose a JPEG, PNG, WebP, GIF, or PDF.',true); return; }
      if(file.size>15*1024*1024) { toast('File too large. Choose a file under 15 MB.',true); return; }
      const id=`upload-${crypto.randomUUID()}`, action=data.get('action');
      localFiles.set(id,{ url:URL.createObjectURL(file),type:file.type });
      p.evidence.push({ id, name:file.name, action, source:'Local owner upload — not analyzed', date:new Date().toISOString().slice(0,10), status:'Submitted — review pending', upload:true, prepared:false });
      const a=p.actions.find(a=>a.id===action); if(a.status!=='Verified in demo') a.status='Evidence submitted';
      p.workflow=verifiedCount(p) ? 'Follow-up needed' : 'Evidence pending'; save('Evidence submitted — review pending. Modeled score unchanged.'); render(); recordModal(id); break;
    }
    case 'insurance-packet': {
      p.insurancePacket = { confirmed: true, insurerName: data.get('insurerName').trim(), insurerEmail: data.get('insurerEmail').trim() };
      save('Insurance packet approved. You control sharing.'); document.getElementById('modal').close(); render(); break;
    }
  }
});
render();
