const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
if (!fs.existsSync(historyDir)) {
    console.log("No VSCode history found!");
    process.exit(1);
}

const targetFiles = [
  'Comunicacao.jsx',
  'Solicitacao.jsx',
  'Nota.jsx',
  'NotaFinal.jsx',
  'RelatorioFinal.jsx',
  'OrdemServico.jsx',
  'NotaTecnica.jsx',
  'Parecer.jsx'
];

let recoveredFiles = {};

function scanHistory() {
    const dirs = fs.readdirSync(historyDir);
    for (const dir of dirs) {
        const entryFile = path.join(historyDir, dir, 'entries.json');
        if (fs.existsSync(entryFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(entryFile, 'utf8'));
                if (data && data.resource) {
                    const resourceStr = String(data.resource);
                    for (const f of targetFiles) {
                        if (resourceStr.endsWith(f) && resourceStr.includes('sisaudin')) {
                            const entries = data.entries || [];
                            if (entries.length > 0) {
                                // latest entry
                                const latestEntry = entries[entries.length - 1];
                                const backupPath = path.join(historyDir, dir, latestEntry.id);
                                if (fs.existsSync(backupPath)) {
                                    if (!recoveredFiles[f] || recoveredFiles[f].timestamp < latestEntry.timestamp) {
                                        recoveredFiles[f] = {
                                            path: backupPath,
                                            timestamp: latestEntry.timestamp
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // ignore JSON parse errors
            }
        }
    }
}

scanHistory();

for (const f of targetFiles) {
    if (recoveredFiles[f]) {
        console.log(`Recovering ${f} from ${recoveredFiles[f].path}...`);
        const originalDir = path.join(__dirname, 'frontend', 'src', 'pages');
        const content = fs.readFileSync(recoveredFiles[f].path, 'utf8');
        fs.writeFileSync(path.join(originalDir, f), content, 'utf8');
        console.log(`Successfully recovered ${f} (${content.length} bytes).`);
    } else {
        console.log(`Could NOT find backup for ${f}.`);
    }
}
