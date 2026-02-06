
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'assets_input', 'Epsom_Calendar_2026_revised_-_version_18_11_25.xlsx');
const workbook = XLSX.readFile(filePath);

console.log("Sheet Names:", workbook.SheetNames);

const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const firstData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
console.log("First sheet Row 2 (Headers):", firstData[1]);
