const fs = require('fs');
const path = require('path');
const pagesDir = 'C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
    const filePath = path.join(pagesDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('setGerenciasDestinatarias') && !content.includes("searchParams.get('gerenciaId')")) {
        const regex = /(useEffect\(\(\) => \{\r?\n\s*const load[A-Za-z]+ = async \(\) => \{)/;
        if (content.match(regex)) {
             content = content.replace(regex, `useEffect(() => {
    const gid = searchParams.get('gerenciaId');
    if (gid && gerenciasFullList.length > 0 && gerenciasDestinatarias.length === 0) {
      const g = gerenciasFullList.find(x => String(x.id || x.gerenciaId) === String(gid));
      if (g) {
        setGerenciasDestinatarias([g]);
      }
    }
  }, [searchParams, gerenciasFullList]);

  $1`);
             changed = true;
        } else {
             console.log('Regex did not match in ' + f);
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Injected effect in ' + f);
    }
});
