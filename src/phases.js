export const propertyPhases = [
  {
    id: 'overview',
    label: 'Overview',
    footerLabel: 'Assess',
    contextTitle: 'Understand the threats',
    contextDescription: 'Open any card to see what was observed and why it matters.',
    contextIcon: 'tree',
  },
  {
    id: 'plan',
    label: 'Action plan',
    footerLabel: 'Plan',
    contextTitle: 'A plan you can start with',
    contextDescription: 'Accept the recommendations. People, dates, and budget are optional.',
    contextIcon: 'calendar',
  },
  {
    id: 'act',
    label: 'Act',
    footerLabel: 'Act',
    contextTitle: 'Do the work, then show it',
    contextDescription: 'Mark tasks done here. Evidence and verification come next.',
    contextIcon: 'check',
  },
  {
    id: 'evidence',
    label: 'Verify',
    footerLabel: 'Verify',
    contextTitle: 'Let the evidence tell the story',
    contextDescription: 'Load the sample, review the changes, then open your report.',
    contextIcon: 'camera',
  },
];

export const phaseFor = id => propertyPhases.find(phase => phase.id === id);
