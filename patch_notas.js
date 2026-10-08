const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'model', 'cadastroBasico');
const servicesDir = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'service', 'cadastroBasico');

// 1. Update Models (add private Integer ordem)
const entitiesToUpdate = [
    'NotaPreliminarInformacao.java',
    'NotaPreliminarConstatacao.java',
    'NotaPreliminarRecomendacao.java',
    'NotaFinalInformacao.java',
    'NotaFinalConstatacao.java',
    'NotaFinalRecomendacao.java'
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
    'NotaPreliminar.java',
    'NotaPreliminarConstatacao.java',
    'NotaFinal.java',
    'NotaFinalConstatacao.java'
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

// 3. Patch Services
const patchService = (serviceFile, prefix) => {
    const filePath = path.join(servicesDir, serviceFile);
    if (!fs.existsSync(filePath)) return;
    let rContent = fs.readFileSync(filePath, 'utf8');

    // Patch updateCollections preliminares
    const rPreliminaresTarget = `        if (dto.getPreliminares() != null) {
            ${prefix.toLowerCase()}.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (${prefix}Informacao incoming : dto.getPreliminares()) {`;
    const rPreliminaresReplace = `        if (dto.getPreliminares() != null) {
            ${prefix.toLowerCase()}.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemPreliminar = 0;
            for (${prefix}Informacao incoming : dto.getPreliminares()) {
                incoming.setOrdem(ordemPreliminar++);`;
    rContent = rContent.replace(rPreliminaresTarget, rPreliminaresReplace);

    const rPreliminaresExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                    } else {`;
    const rPreliminaresExistingReplace = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {`;
    rContent = rContent.replace(rPreliminaresExisting, rPreliminaresExistingReplace);

    // Patch updateCollections constatacoes
    const rConstatacoesTarget = `        if (dto.getConstatacoes() != null) {
            ${prefix.toLowerCase()}.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (${prefix}Constatacao incoming : dto.getConstatacoes()) {`;
    const rConstatacoesReplace = `        if (dto.getConstatacoes() != null) {
            ${prefix.toLowerCase()}.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemConstatacao = 0;
            for (${prefix}Constatacao incoming : dto.getConstatacoes()) {
                incoming.setOrdem(ordemConstatacao++);`;
    rContent = rContent.replace(rConstatacoesTarget, rConstatacoesReplace);

    let rConstatacoesExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                    } else {`;
    if (rContent.includes('existing.setResumoFato')) {
        rConstatacoesExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setResumoFato(incoming.getResumoFato());
                        existing.setResumoCriterio(incoming.getResumoCriterio());
                        existing.setResumoCausa(incoming.getResumoCausa());
                        existing.setResumoImpacto(incoming.getResumoImpacto());
                        updateRecomendacoes(existing, incoming);
                    } else {`;
    } else if (rContent.includes('updateRecomendacoes(existing, incoming);')) {
        rConstatacoesExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        updateRecomendacoes(existing, incoming);
                    } else {`;
    }
    
    let rConstatacoesExistingReplace = rConstatacoesExisting.replace('} else {', '    existing.setOrdem(incoming.getOrdem());\n                    } else {');
    rContent = rContent.replace(rConstatacoesExisting, rConstatacoesExistingReplace);

    // Patch updateRecomendacoes
    if (rContent.includes('updateRecomendacoes')) {
        const rRecTarget = `    private void updateRecomendacoes(${prefix}Constatacao existing, ${prefix}Constatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (${prefix}Recomendacao rIncoming : incoming.getRecomendacoes()) {`;
        const rRecReplace = `    private void updateRecomendacoes(${prefix}Constatacao existing, ${prefix}Constatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemRec = 0;
            for (${prefix}Recomendacao rIncoming : incoming.getRecomendacoes()) {
                rIncoming.setOrdem(ordemRec++);`;
        rContent = rContent.replace(rRecTarget, rRecReplace);

        const rRecExisting = `                    if (rExisting != null) {
                        rExisting.setContent(rIncoming.getContent());
                        rExisting.setDataLimite(rIncoming.getDataLimite());
                        rExisting.setNivelRisco(rIncoming.getNivelRisco());
                        rExisting.setGerencia(rIncoming.getGerencia());
                        
                        rExisting.setTipoBeneficio(rIncoming.getTipoBeneficio());
                        rExisting.setDetalheBeneficio(rIncoming.getDetalheBeneficio());
                        rExisting.setStatusBeneficio(rIncoming.getStatusBeneficio());
                        rExisting.setAnoImplementacao(rIncoming.getAnoImplementacao());
                        rExisting.setDescricaoBeneficioRealizado(rIncoming.getDescricaoBeneficioRealizado());
                        rExisting.setDescricaoCustoBeneficio(rIncoming.getDescricaoCustoBeneficio());
                        rExisting.setValorCustoBeneficio(rIncoming.getValorCustoBeneficio());
                        rExisting.setValorBrutoBeneficio(rIncoming.getValorBrutoBeneficio());
                        rExisting.setValorLiquidoBeneficio(rIncoming.getValorLiquidoBeneficio());
                        
                        updateReportes(rExisting, rIncoming);
                    } else {`;
        let rRecExistingReplace = rRecExisting.replace('updateReportes(rExisting, rIncoming);', 'rExisting.setOrdem(rIncoming.getOrdem());\n                        updateReportes(rExisting, rIncoming);');
        // If updateReportes is missing:
        if (!rRecExistingReplace.includes('rExisting.setOrdem')) {
             rRecExistingReplace = rRecExisting.replace('} else {', 'rExisting.setOrdem(rIncoming.getOrdem());\n                    } else {');
        }
        rContent = rContent.replace(rRecExisting, rRecExistingReplace);
    }

    fs.writeFileSync(filePath, rContent, 'utf8');
    console.log('Patched ' + serviceFile);
};

patchService('NotaPreliminarService.java', 'NotaPreliminar');
patchService('NotaFinalService.java', 'NotaFinal');
