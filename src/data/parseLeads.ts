// Temporary script to parse leads Excel
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const data = fs.readFileSync('./src/data/leads26.xlsx');
const workbook = XLSX.read(data, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(jsonData, null, 2));
