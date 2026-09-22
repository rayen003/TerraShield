import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, category, summary, loadPrepared, applyReview, reportSummary, unresolved, useRecommendedPlan, startWork, markOwnerComplete } from '../src/data.js';
import { answer } from '../src/assistant.js';

test('complete Oakridge journey keeps assessment, portfolio, report, and reset consistent', () => {
  const state = createInitialState(), oak = state.properties[0];
  assert.deepEqual(summary(state.properties), {total:5,elevated:3,pending:1,verified:0});
  assert.equal(applyReview(oak), false);
  assert.equal(oak.score,82);
  assert.equal(loadPrepared(oak),true);
  assert.equal(oak.score,82);
  assert.equal(summary(state.properties).pending,2);
  assert.equal(loadPrepared(oak),false);
  assert.equal(applyReview(oak),true);
  assert.equal(oak.score,58);
  assert.equal(category(oak.score),'Moderate');
  assert.equal(oak.workflow,'Follow-up needed');
  assert.deepEqual(unresolved(oak).map(a=>a.id),['C','D']);
  assert.deepEqual(summary(state.properties),{total:5,elevated:2,pending:1,verified:1});
  assert.equal(applyReview(oak),false);
  assert.equal(oak.history.length,1);
  const report=reportSummary(oak);
  assert.equal(report.updatedModeledScore,58);
  assert.equal(report.verifiedChanges.length,2);
  assert.equal(report.outstandingActions.length,2);
  const flagged = answer('Why is this property flagged?',oak).text;
  assert.match(flagged,/baseline observations from August 15/);
  assert.match(flagged,/addressed in prepared September 15 evidence/);
  assert.match(flagged,/Remaining concern includes surrounding vegetation/);
  assert.equal(createInitialState().properties[0].score,82);
});
test('arbitrary uploads remain pending even after prepared review', () => {
  const p=createInitialState().properties[0];
  p.evidence.push({id:'upload',status:'Submitted — review pending',upload:true,action:'A'});
  assert.equal(p.score,82);
  loadPrepared(p); applyReview(p);
  assert.equal(p.evidence.find(e=>e.id==='upload').status,'Submitted — review pending');
  assert.equal(summary([p]).pending,1);
});
test('other property records cannot access prepared review', () => {
  for(const p of createInitialState().properties.slice(1)) {
    const score=p.score;
    assert.equal(loadPrepared(p),false);
    assert.equal(applyReview(p),false);
    assert.equal(p.score,score);
    assert.ok(p.actions.length);
    assert.ok(p.evidence.length);
  }
});
test('assistant grounds context, avoids insurance promises, and does not mutate records', () => {
  const p=createInitialState().properties[1], before=JSON.stringify(p);
  assert.match(answer('Why is this property flagged?',p).text,/Dense shrubs beside the entry deck/);
  assert.match(answer('What changed after the work?',p).text,/No changes have been verified/);
  assert.match(answer('Will this lower my insurance premium?',p).text,/cannot guarantee a discount/);
  assert.equal(answer('Create a four-week mitigation plan.',p).action,'apply-schedule');
  assert.equal(JSON.stringify(p),before);
});
test('risk categories use exact demo boundaries',()=> {
  assert.equal(category(39),'Lower'); assert.equal(category(40),'Moderate');
  assert.equal(category(59),'Moderate'); assert.equal(category(60),'Elevated');
});
test('guided transitions distinguish plan, work, completion, and review',()=> {
  const p=createInitialState().properties[0];
  useRecommendedPlan(p);
  assert.ok(p.actions.every(a => a.status === 'Planned'));
  startWork(p);
  assert.deepEqual(p.actions.filter(a => a.priority === 'High').map(a => a.status), ['In progress','In progress']);
  assert.equal(markOwnerComplete(p, 'A'), true);
  assert.equal(p.actions.find(a => a.id === 'A').status, 'Owner marked complete');
  assert.equal(markOwnerComplete(p, 'missing'), false);
  loadPrepared(p);
  applyReview(p); assert.equal(p.verification, 'Verified in demo');
});
