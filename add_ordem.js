const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'model', 'cadastroBasico');
const servicesDir = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'service', 'cadastroBasico');

// 1. Update Models (add private Integer ordem)
const entitiesToUpdate = [
    'RelatorioFinalInformacao.java',
    'RelatorioPreliminarInformacao.java',
    'RelatorioFinalConstatacao.java',
    'RelatorioPreliminarConstatacao.java',
    'RelatorioFinalRecomendacao.java'
];

entitiesToUpdate.forEach(file => {
    const filePath = path.join(modelsDir, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('private Integer ordem;')) {
        content = content.replace(/public class [A-Za-z]+ \{/, `$&
    private Integer ordem;`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Added ordem to ${file}`);
    }
});

// 2. Update Parents (add @OrderBy("ordem ASC"))
const parentsToUpdate = [
    'RelatorioFinal.java',
    'RelatorioPreliminar.java',
    'RelatorioFinalConstatacao.java'
];

parentsToUpdate.forEach(file => {
    const filePath = path.join(modelsDir, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if needed
    if (!content.includes('import jakarta.persistence.OrderBy;')) {
        content = content.replace('import jakarta.persistence.*;', 'import jakarta.persistence.*;\nimport jakarta.persistence.OrderBy;');
    }
    
    // Replace List declarations
    content = content.replace(/@Builder\.Default\s+private java\.util\.List<[A-Za-z]+> (preliminares|constatacoes|recomendacoes)/g, (match) => {
        if (!content.includes(`@OrderBy("ordem ASC")\n    ${match}`)) {
            return `@OrderBy("ordem ASC")\n    ${match}`;
        }
        return match;
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added @OrderBy to ${file}`);
});

// 3. Update Services
const updateService = (serviceFile, collections) => {
    const filePath = path.join(servicesDir, serviceFile);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    collections.forEach(coll => {
        const type = coll.type; // e.g. RelatorioFinalInformacao
        const field = coll.field; // e.g. preliminares
        
        // Find the loop `for (Type incoming : dto.get...())`
        const regex = new RegExp(`for \\(${type} incoming : [^)]+\\.get${field.charAt(0).toUpperCase() + field.slice(1)}\\(\\)\\) \\{`);
        if (content.match(regex)) {
            // We need to inject `int ordem = 0;` before the loop, and `incoming.setOrdem(ordem);` and `existing.setOrdem(ordem); ordem++;` inside.
            // A simpler way with regex replacement:
            
            // If already patched, skip
            if (content.includes(`int ordem${field} = 0;`)) return;
            
            content = content.replace(regex, (match) => {
                return `int ordem${field} = 0;\n            ${match}`;
            });
            
            // Now inject setOrdem.
            // This is tricky because the if/else block inside the loop can vary.
            // Let's just find `existing.setTitulo` or `incoming.setRelatorioFinal` and inject.
            // Actually, we can just replace `if (existing != null) {` with `if (existing != null) { existing.setOrdem(ordem${field}++);`
            // And replace `incoming.setRelatorioFinal(relatorio);` with `incoming.setOrdem(ordem${field}++); incoming.setRelatorioFinal(relatorio);` (or similar depending on context)
        }
    });
    
    // Better way to patch service: regex is fragile. I'll just rewrite the updateCollections method using a targeted replace.
}
