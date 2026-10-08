const fs = require('fs');
const path = require('path');
const pagesDir = 'C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
    const filePath = path.join(pagesDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Fix the navigate behavior
    // Look for: const queryStr = itemTrabalhoIdParam ? `?itemTrabalhoId=${itemTrabalhoIdParam}` : '';
    //           navigate(`/xxxx/${current.id}${queryStr}`, { replace: true });
    // And replace with:
    //           const params = new URLSearchParams(searchParams);
    //           const qStr = params.toString() ? `?${params.toString()}` : '';
    //           navigate(`/xxxx/${current.id}${qStr}`, { replace: true });
    
    // We can do it broadly: replace `const queryStr = itemTrabalhoIdParam ? \`?itemTrabalhoId=\${itemTrabalhoIdParam}\` : '';\n          navigate(\`/${path}/\${current[A-Za-z]*\.id}\${queryStr}\`, { replace: true });`
    // Actually, let's just replace `const queryStr = itemTrabalhoIdParam ? \`?itemTrabalhoId=\${itemTrabalhoIdParam}\` : '';` with `const paramsToPass = new URLSearchParams(searchParams);\n          const queryStr = paramsToPass.toString() ? '?' + paramsToPass.toString() : '';`
    const queryStrRegex = /const queryStr = itemTrabalhoIdParam \? `\?itemTrabalhoId=\$\{itemTrabalhoIdParam\}` : '';/g;
    if (content.match(queryStrRegex)) {
        content = content.replace(queryStrRegex, "const paramsToPass = new URLSearchParams(searchParams);\n          const queryStr = paramsToPass.toString() ? `?${paramsToPass.toString()}` : '';");
        changed = true;
    }

    // 2. Add effect to set gerenciasDestinatarias and remove 'APROVADO' filter and populate dropdown when non-aprovado
    // Filter issue: items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado');
    const filterRegex = /items = items\.filter\(it => it\.status === 'APROVADO' \|\| it\.status === 'Aprovado'\);/g;
    if (content.match(filterRegex)) {
        content = content.replace(filterRegex, "items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado' || String(it.id) === String(itemTrabalhoIdParam));");
        changed = true;
    }

    // Gerencias destinatarias issue:
    // Need to inject an effect somewhere. 
    // Is gerenciaIdParam defined?
    // In some components, it might not even be defined, let's just inject the hook logic right before `useEffect(() => { const loadSa = ... `
    // Wait, let's look for `const fetchItensAndGerencias = async () => {`
    // We can inject `useEffect(() => { const gid = searchParams.get('gerenciaId'); if (gid && gerenciasFullList.length > 0 && (!gerenciasDestinatarias || gerenciasDestinatarias.length === 0)) { const g = gerenciasFullList.find(x => String(x.id || x.gerenciaId) === String(gid)); if (g) setGerenciasDestinatarias([g]); } }, [searchParams, gerenciasFullList]);`
    // Wait, does every page use `gerenciasDestinatarias`? `Comunicacao` uses it. `Solicitacao` uses it. 
    // What if they don't?
    // Let's check which ones have `setGerenciasDestinatarias`
    if (content.includes('setGerenciasDestinatarias(')) {
        if (!content.includes('const gid = searchParams.get(\'gerenciaId\');')) {
             const effectRegex = /(useEffect\(\(\) => \{\n\s*const load.*? = async \(\) => \{)/;
             if (content.match(effectRegex)) {
                 content = content.replace(effectRegex, `useEffect(() => {
    const gid = searchParams.get('gerenciaId');
    if (gid && gerenciasFullList.length > 0 && gerenciasDestinatarias.length === 0) {
      const g = gerenciasFullList.find(x => String(x.id || x.gerenciaId) === String(gid));
      if (g) {
        setGerenciasDestinatarias([g]);
      }
    }
  }, [searchParams, gerenciasFullList]);\n\n  $1`);
                 changed = true;
             }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + f);
    }
});
