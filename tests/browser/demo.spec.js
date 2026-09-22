import { test, expect } from '@playwright/test';

async function switchProperty(page, id, name) {
  await page.getByRole('button', { name: 'Switch property', exact: true }).click();
  await page.getByRole('option', { name: new RegExp(name) }).click();
}

// Keep automated navigation and zoom tests off the public tile service.
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
});

test('complete live pitch journey and reset', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.score-value')).toHaveText('82/100');
  await expect(page.locator('.observation')).toHaveCount(3);
  await page.screenshot({ path: 'artifacts/workspace-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Ask TerraShield', exact: true }).click();
  await page.getByRole('button', { name: 'What should I do first?', exact: true }).click();
  await expect(page.locator('.message.assistant')).toContainText('start with');
  await page.getByRole('button', { name: 'Create a four-week mitigation plan.', exact: true }).click();
  await page.getByRole('button', { name: 'Apply to action plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start work', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close assistant' }).click();
  await page.getByRole('button', { name: 'Start work', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Intervention', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Mark demo work done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue to verification', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to verification', exact: true }).click();
  await expect(page.locator('.verification-path')).toContainText('Get your final report');
  await page.getByRole('button', { name: '1. Load prepared evidence', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Still unverified');
  await page.getByRole('button', { name: 'Apply simulated review result', exact: true }).click();
  await expect(page.locator('.updated-risk-panel')).toContainText('82');
  await expect(page.locator('.updated-risk-panel')).toContainText('58');
  await page.getByRole('tab', { name: 'Risk', exact: true }).click();
  await expect(page.locator('.observation .status-chip.done')).toHaveCount(2);
  await expect(page.locator('.score-value')).toHaveText('58/100');
  await page.getByRole('button', { name: 'See updated risk', exact: true }).click();
  await page.getByRole('button', { name: 'Build insurance-ready report', exact: true }).click();
  await page.getByRole('button', { name: 'Open insurance-ready report', exact: true }).click();
  await expect(page.locator('.report-document')).toContainText('Illustrative demo report');
  await expect(page.locator('.report-outstanding')).toHaveCount(2);
  await page.getByRole('button', { name: 'Review insurance packet', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Nothing is sent automatically');
  await page.getByLabel('Insurer or agent name Optional', { exact: true }).fill('Demo Mutual');
  await page.getByLabel('Email address Optional', { exact: true }).fill('agent@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Approve packet for sharing', exact: true }).click();
  await expect(page.locator('.insurance-packet')).toContainText('Packet ready for your review');
  await expect(page.getByRole('button', { name: 'Prepare email to insurer', exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('terrashield-oakridge-illustrative-report.json');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: 'artifacts/illustrative-report.pdf', format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await expect(page.locator('.summary-card strong')).toHaveText(['05','02','01','01']);
  await expect(page.getByRole('row').filter({ hasText: 'Oakridge House' })).toContainText('58');
  await page.reload();
  await expect(page.locator('.score-value')).toHaveText('58/100');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('.score-value')).toHaveText('82/100');
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await expect(page.locator('.summary-card strong')).toHaveText(['05','03','01','00']);
  expect(errors).toEqual([]);
});

test('local uploads, property selection, filters, controls and mobile layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Fit to property', exact: true }).click();
  await page.getByText('Map layers', { exact: true }).click();
  await page.getByLabel('Surrounding vegetation', { exact: true }).uncheck();
  await page.getByLabel('Surrounding vegetation', { exact: true }).check();
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  await page.getByText('Upload your own evidence', { exact: true }).click();
  await page.locator('#evidence-file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN7sAAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: 'Submit evidence for review', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Submitted — review pending');
  await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('tab', { name: 'Risk', exact: true }).click();
  await expect(page.locator('.score-value')).toHaveText('82/100');
  for (const [id, name, score] of [['cedar','Cedar Grove Home',67],['valley','Valley View Residence',45],['meadow','Meadow Lane Home',28],['ridgeway','Ridgeway Lodge',74]]) {
    await switchProperty(page, id, name);
    await expect(page.locator('.score-value')).toHaveText(`${score}/100`);
    await expect(page.locator('.property-marker.selected')).toHaveAttribute('title', new RegExp(id === 'ridgeway' ? 'Ridgeway' : id[0].toUpperCase()+id.slice(1)));
  }
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  await expect(page.locator('.demo-route')).toContainText('Full demo path');
  await page.getByRole('button', { name: 'Continue demo with Oakridge', exact: true }).click();
  await expect(page.locator('.property-name-row h2')).toHaveText('Oakridge House');
  await expect(page.locator('.verification-path')).toContainText('Get your final report');
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await page.getByLabel('Search properties', { exact: true }).fill('Valley');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Search properties', { exact: true }).fill('missing');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await page.getByRole('row').filter({ hasText: 'Oakridge House' }).getByRole('button', { name: 'Open property', exact: true }).click();
  for (const [width,height] of [[1280,800],[390,844]]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('.score-value')).toHaveText('82/100');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/workspace-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Ask TerraShield', exact: true }).click();
  await expect(page.locator('.assistant-drawer')).toBeVisible();
  await page.getByRole('button', { name: 'Close assistant' }).click();
});

test('editable plans, unsupported uploads, map selection and offline fallback', async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Review recommendation', exact: true }).click();
  await page.locator('#action-A > summary').click();
  const action = page.locator('#action-A');
  await action.getByText('Assignee, date & notes Optional', { exact: true }).click();
  await action.getByLabel('Responsible person', { exact: true }).fill('Demo owner');
  await action.getByLabel('Target date', { exact: true }).fill('2026-09-28');
  await action.getByRole('combobox', { name: 'Status', exact: true }).selectOption('In progress');
  await action.getByLabel('Short note', { exact: true }).fill('Obtain advice before vegetation work.');
  await expect(action.locator('select option')).not.toContainText(['Verified in demo']);
  await action.getByRole('button', { name: 'Save action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue to work', exact: true })).toBeVisible();
  await page.getByText('Schedule & budget Optional', { exact: true }).click();
  await page.getByRole('button', { name: 'Create four-week plan', exact: true }).click();
  await page.getByRole('textbox', { name: 'Week 1', exact: true }).fill('Photograph baseline and arrange advice.');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await page.getByLabel('Budget (USD)', { exact: true }).fill('2500');
  await page.locator('.budget-box').getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to work', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Intervention', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await page.getByRole('tab', { name: 'Recommendation', exact: true }).click();
  await page.getByText('Schedule & budget Optional', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Week 1', exact: true })).toHaveValue('Photograph baseline and arrange advice.');
  await expect(page.getByLabel('Budget (USD)', { exact: true })).toHaveValue('2500');
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  await page.getByText('Upload your own evidence', { exact: true }).click();
  await page.locator('#evidence-file').setInputFiles({ name: 'unsupported.txt', mimeType: 'text/plain', buffer: Buffer.from('demo') });
  await page.getByRole('button', { name: 'Submit evidence for review', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unsupported file');
  await page.getByText('Map layers', { exact: true }).click();
  await page.getByLabel('Street basemap (online)', { exact: true }).check();
  await expect(page.locator('#map-mode')).toHaveText('Local schematic · map tiles unavailable');
  await expect(page.locator('.leaflet-schematic-pane img').last()).toBeVisible();
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await page.locator('.property-marker[title="Cedar Grove Home"]').click();
  await expect(page.locator('.property-name-row h2')).toHaveText('Cedar Grove Home');
  await page.getByRole('button', { name: 'Ask TerraShield', exact: true }).click();
  await page.getByRole('button', { name: 'Why is this property flagged?', exact: true }).click();
  await expect(page.locator('.message.assistant')).toContainText('Dense shrubs beside the entry deck');
  await page.getByRole('button', { name: 'Will this lower my insurance premium?', exact: true }).click();
  await expect(page.locator('.message.assistant').last()).toContainText('cannot guarantee a discount');
});

test('street tiles are default, attributed, and switch cleanly to schematic', async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN7sAAAAASUVORK5CYII=', 'base64'),
  }));
  await page.goto('/');
  await expect(page.locator('#map-mode')).toHaveText('OpenStreetMap · synthetic overlays');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect(page.locator('.leaflet-control-attribution').getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
  await page.getByText('Map layers', { exact: true }).click();
  await expect(page.getByLabel('Street basemap (online)', { exact: true })).toBeChecked();
  await page.getByLabel('Street basemap (online)', { exact: true }).uncheck();
  await expect(page.locator('#map-mode')).toHaveText('Illustrative local schematic');
  await expect(page.locator('.leaflet-tile-pane img')).toHaveCount(0);
  await page.getByLabel('Street basemap (online)', { exact: true }).check();
  await expect(page.locator('#map-mode')).toHaveText('OpenStreetMap · synthetic overlays');
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await expect(page.locator('#map-mode')).toHaveText('OpenStreetMap · synthetic overlays');
  await expect(page.locator('.property-marker')).toHaveCount(5);
});

test('property panel is sole phase navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('tablist', { name: 'Property details' })).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveText(['Risk', 'Recommendation', 'Intervention', 'Verification', 'Updated risk', 'Report']);
  await expect(page.locator('.journey')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Recommendation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use recommended plan', exact: true })).toBeVisible();
  await expect(page.locator('.planning-options')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Use recommended plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start work', exact: true })).toBeVisible();
  await switchProperty(page, 'cedar', 'Cedar Grove Home');
  await page.getByRole('tab', { name: 'Intervention', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue to verification', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mark work done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue to verification', exact: true })).toBeVisible();
});
