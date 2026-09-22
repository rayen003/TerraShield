const clean = value => String(value ?? '')
  .replace(/[–—]/g, '-')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/[\\()]/g, '\\$&');

function wrap(text, width = 88) {
  const words = String(text).split(/\s+/);
  const lines = []; let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

export function generateIllustrativeReportPdf(report) {
  const lines = [
    ['TerraShield | Illustrative insurer packet', 18],
    ['', 11],
    [`Property: ${report.property} | Fictional property record`, 12],
    [`Baseline assessment: ${report.baselineDate} | Follow-up evidence: ${report.followupDate}`, 10],
    ['', 10],
    [`Modeled index: ${report.baselineScore}/100 -> ${report.updatedModeledScore}/100`, 15],
    ['Illustrative composite index. Not an insurance quote or probability of fire.', 10],
    ['', 10],
    ['Verified observable changes', 12],
    ...report.verifiedChanges.flatMap(item => wrap(`• ${item}`, 84).map(line => [line, 10])),
    ['', 10],
    ['Outstanding actions and evidence gaps', 12],
    ...report.outstandingActions.flatMap(item => wrap(`• ${item.title}: ${item.requiredEvidence}`, 84).map(line => [line, 10])),
    ['', 10],
    ['Evidence sources', 12],
    ...report.evidence.flatMap(item => wrap(`• ${item.name} | ${item.source} | ${item.date} | ${item.status}`, 84).map(line => [line, 9])),
    ['', 10],
    ['Review method', 12],
    ...wrap(report.reviewMethod, 84).map(line => [line, 10]),
    ['', 10],
    ...wrap(report.closingNote, 84).map(line => [line, 9]),
  ];
  let y = 790;
  const commands = ['BT'];
  for (const [line, size] of lines) {
    if (y < 44) break;
    commands.push(`/F1 ${size} Tf`, `50 ${y} Td (${clean(line)}) Tj`, `-50 -${y} Td`);
    y -= size + 7;
  }
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
