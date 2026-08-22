import fs from 'fs';
const log = process.env.TEMP + '/migrate-timing.txt';
fs.appendFileSync(log, 'start ' + Date.now() + '\n');
await new Promise(r => setTimeout(r, 8000));
fs.appendFileSync(log, 'end ' + Date.now() + '\n');
