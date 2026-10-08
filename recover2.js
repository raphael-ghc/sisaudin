const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
if (!fs.existsSync(historyDir)) {
    console.log("No VSCode history found!");
    process.exit(1);
}

function searchAll() {
    const dirs = fs.readdirSync(historyDir);
    let bestMatch = { f: 'NotaFinal.jsx', path: null, len: 0, ts: 0 };
    let bestMatch2 = { f: 'NotaTecnica.jsx', path: null, len: 0, ts: 0 };
    let bestMatch3 = { f: 'Parecer.jsx', path: null, len: 0, ts: 0 };

    for (const dir of dirs) {
        const fullDir = path.join(historyDir, dir);
        if (fs.statSync(fullDir).isDirectory()) {
            const files = fs.readdirSync(fullDir);
            for (const file of files) {
                if (file !== 'entries.json') {
                    const backupPath = path.join(fullDir, file);
                    try {
                        const content = fs.readFileSync(backupPath, 'utf8');
                        const ts = fs.statSync(backupPath).mtimeMs;
                        
                        if (content.includes('export default function NotaFinal') && content.length > bestMatch.len) {
                            bestMatch.path = backupPath;
                            bestMatch.len = content.length;
                            bestMatch.ts = ts;
                        }
                        if (content.includes('export default function NotaTecnica') && content.length > bestMatch2.len) {
                            bestMatch2.path = backupPath;
                            bestMatch2.len = content.length;
                            bestMatch2.ts = ts;
                        }
                        if (content.includes('export default function Parecer') && content.length > bestMatch3.len) {
                            bestMatch3.path = backupPath;
                            bestMatch3.len = content.length;
                            bestMatch3.ts = ts;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }
    }
    
    console.log("NotaFinal.jsx best match:", bestMatch);
    console.log("NotaTecnica.jsx best match:", bestMatch2);
    console.log("Parecer.jsx best match:", bestMatch3);
    
    if (bestMatch.path) {
        fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'pages', 'NotaFinal.jsx'), fs.readFileSync(bestMatch.path, 'utf8'));
    }
    if (bestMatch2.path) {
        fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'pages', 'NotaTecnica.jsx'), fs.readFileSync(bestMatch2.path, 'utf8'));
    }
    if (bestMatch3.path) {
        fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'pages', 'Parecer.jsx'), fs.readFileSync(bestMatch3.path, 'utf8'));
    }
}

searchAll();
