export const propertyPhases = [
  {
    id: 'overview',
    label: 'Risk',
    footerLabel: 'Risk',
    contextTitle: 'Understand the threats',
    contextDescription: 'Open any card to see what was observed and why it matters.',
    contextIcon: 'tree',
  },
  {
    id: 'plan',
    label: 'Recommendation',
    footerLabel: 'Recommendation',
    contextTitle: 'A plan you can start with',
    contextDescription: 'Accept the recommendations. People, dates, and budget are optional.',
    contextIcon: 'calendar',
  },
  {
    id: 'act',
    label: 'Intervention',
    footerLabel: 'Intervention',
    contextTitle: 'Do the work, then show it',
    contextDescription: 'Mark tasks done here. Evidence and verification come next.',
    contextIcon: 'check',
  },
  {
    id: 'evidence',
    label: 'Verification',
    footerLabel: 'Verify',
    contextTitle: 'Let the evidence tell the story',
    contextDescription: 'Load the sample, review the changes, then open your report.',
    contextIcon: 'camera',
  },
  {
    id: 'updated-risk',
    label: 'Updated risk',
    footerLabel: 'Updated risk',
    contextTitle: 'See what changed',
    contextDescription: 'Verified changes update modeled risk. Remaining gaps stay visible.',
    contextIcon: 'target',
  },
  {
    id: 'report',
    label: 'Report',
    footerLabel: 'Report',
    contextTitle: 'Build your insurer packet',
    contextDescription: 'Review full report before owner approval and insurer sharing.',
    contextIcon: 'report',
  },
];

export const phaseFor = id => propertyPhases.find(phase => phase.id === id);
