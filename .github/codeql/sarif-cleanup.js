import fs from 'node:fs';
const sarifFile = JSON.parse(fs.readFileSync('./eslint.sarif', 'utf8'));
const actualProblems = sarifFile.runs[0].results.filter(
  ({ suppressions = [] }) => !suppressions.length
);
sarifFile.runs[0].results = actualProblems;
fs.writeFileSync('./eslint.sarif', JSON.stringify(sarifFile, null, 2));
