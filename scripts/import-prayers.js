
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '..', 'assets_input', 'Epsom_Calendar_2026_revised_-_version_18_11_25.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'app', 'data', 'prayer_schedule.json');

// Helper to format Excel fractional time to HH:MM
// Custom fix: Excel might have stored 3:00 PM as 3:00 AM (0.125)
// Logic: Parse standard fraction. If isPm is true and hours < 12, add 12.
function formatTime(excelTime, isPm = false) {
    if (!excelTime || isNaN(excelTime)) return null;

    let fraction = excelTime % 1;

    const totalSeconds = Math.round(fraction * 24 * 60 * 60);
    let hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (isPm && hours < 12) {
        hours += 12;
    }

    // Pad with leading zeros
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

// Map month name to index
const MONTHS = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

function processFile() {
    console.log(`Reading file: ${INPUT_FILE}`);
    const workbook = XLSX.readFile(INPUT_FILE);

    const schedule = {};

    workbook.SheetNames.forEach(sheetName => {
        // Parse Sheet Name "January 2026"
        const [monthName, yearStr] = sheetName.split(' ');
        const year = parseInt(yearStr);
        const monthIndex = MONTHS[monthName];

        if (monthIndex === undefined || isNaN(year)) {
            console.warn(`Skipping sheet: ${sheetName}`);
            return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Data starts at row index 2 (row 3 in excel)
        // Headers are at row index 1
        // [Day, Date, Rajab, Begins Fazr, Fazr Jama’ah, Sunrise, Zuhur Begins, Jama’ah, Begins Asr, Jama’ah, Magrib Jama’ah, Isah Begin, Isha Jamaah]
        // Indices:
        // 1: Date (Day of month)
        // 3: Fajr Adhan
        // 4: Fajr Jamat
        // 5: Shuruq
        // 6: Dhuhr Adhan
        // 7: Dhuhr Jamat
        // 8: Asr Adhan
        // 9: Asr Jamat
        // 10: Maghrib (Adhan/Jamat)
        // 11: Isha Adhan
        // 12: Isha Jamat

        for (let i = 2; i < rawData.length; i++) {
            const row = rawData[i];
            const dayOfMonth = row[1];

            if (!dayOfMonth) continue; // Skip empty rows

            // Construct Date Key YYYY-MM-DD
            // Note: Months in JS Date are 0-indexed, but in formatted string we want 01-12
            const dateKey = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`;

            schedule[dateKey] = {
                fajr: { adhan: formatTime(row[3]), jamat: formatTime(row[4]) },
                shuruq: formatTime(row[5]),
                // Force PM for Dhuhr if it looks like < 12 but > 6? Actually just trust it or force?
                // User requested Adhan always be original Dhuhr. 
                // Dhuhr is usually PM. If formatted as 01:00 it means 13:00.
                // Safe to assume Dhuhr Adhan/Jamat are PM if < 10? E.g. 1pm, 2pm. But 12pm is 12.
                // Let's rely on standard logic: If < 11 (e.g. 1, 2, 3), add 12.
                dhuhr: { adhan: formatTime(row[6], true), jamat: formatTime(row[7], true) },
                asr: { adhan: formatTime(row[8], true), jamat: formatTime(row[9], true) },
                maghrib: { adhan: formatTime(row[10], true), jamat: formatTime(row[10], true) },
                isha: { adhan: formatTime(row[11], true), jamat: formatTime(row[12], true) },
                hijri: row[2] ? row[2].toString() : null
            };
        }
    });

    // Ensure output directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schedule, null, 2));
    console.log(`Successfully wrote ${Object.keys(schedule).length} entries to ${OUTPUT_FILE}`);
}

processFile();
