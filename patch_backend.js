const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'model', 'cadastroBasico');

// Apply add_ordem to models
require('./add_ordem.js');

// Now patch the Services
const relatorioFinalServicePath = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'service', 'cadastroBasico', 'RelatorioFinalService.java');
let rfsContent = fs.readFileSync(relatorioFinalServicePath, 'utf8');

// Patch updateCollections preliminares
const rfsPreliminaresTarget = `        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioFinalInformacao incoming : dto.getPreliminares()) {`;
const rfsPreliminaresReplace = `        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemPreliminar = 0;
            for (RelatorioFinalInformacao incoming : dto.getPreliminares()) {
                incoming.setOrdem(ordemPreliminar++);`;
rfsContent = rfsContent.replace(rfsPreliminaresTarget, rfsPreliminaresReplace);

// existing.setOrdem
const rfsPreliminaresExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                    } else {`;
const rfsPreliminaresExistingReplace = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {`;
rfsContent = rfsContent.replace(rfsPreliminaresExisting, rfsPreliminaresExistingReplace);

// Patch updateCollections constatacoes
const rfsConstatacoesTarget = `        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioFinalConstatacao incoming : dto.getConstatacoes()) {`;
const rfsConstatacoesReplace = `        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemConstatacao = 0;
            for (RelatorioFinalConstatacao incoming : dto.getConstatacoes()) {
                incoming.setOrdem(ordemConstatacao++);`;
rfsContent = rfsContent.replace(rfsConstatacoesTarget, rfsConstatacoesReplace);

// existing.setOrdem
const rfsConstatacoesExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setResumoFato(incoming.getResumoFato());
                        existing.setResumoCriterio(incoming.getResumoCriterio());
                        existing.setResumoCausa(incoming.getResumoCausa());
                        existing.setResumoImpacto(incoming.getResumoImpacto());
                        updateRecomendacoes(existing, incoming);
                    } else {`;
const rfsConstatacoesExistingReplace = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setResumoFato(incoming.getResumoFato());
                        existing.setResumoCriterio(incoming.getResumoCriterio());
                        existing.setResumoCausa(incoming.getResumoCausa());
                        existing.setResumoImpacto(incoming.getResumoImpacto());
                        existing.setOrdem(incoming.getOrdem());
                        updateRecomendacoes(existing, incoming);
                    } else {`;
rfsContent = rfsContent.replace(rfsConstatacoesExisting, rfsConstatacoesExistingReplace);

// Patch updateRecomendacoes
const rfsRecTarget = `    private void updateRecomendacoes(RelatorioFinalConstatacao existing, RelatorioFinalConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioFinalRecomendacao rIncoming : incoming.getRecomendacoes()) {`;
const rfsRecReplace = `    private void updateRecomendacoes(RelatorioFinalConstatacao existing, RelatorioFinalConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemRec = 0;
            for (RelatorioFinalRecomendacao rIncoming : incoming.getRecomendacoes()) {
                rIncoming.setOrdem(ordemRec++);`;
rfsContent = rfsContent.replace(rfsRecTarget, rfsRecReplace);

// existing.setOrdem (recommendation)
const rfsRecExisting = `                    if (rExisting != null) {
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
const rfsRecExistingReplace = `                    if (rExisting != null) {
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
                        
                        rExisting.setOrdem(rIncoming.getOrdem());
                        updateReportes(rExisting, rIncoming);
                    } else {`;
rfsContent = rfsContent.replace(rfsRecExisting, rfsRecExistingReplace);

// We must also handle the `else` case when creating NEW items (incoming.setOrdem is already done at the top of the loop, so the new item will have it set).
fs.writeFileSync(relatorioFinalServicePath, rfsContent, 'utf8');
console.log('Patched RelatorioFinalService');


// Now patch RelatorioPreliminarService
const relatorioPreliminarServicePath = path.join(__dirname, 'backend', 'src', 'main', 'java', 'sisaudin', 'service', 'cadastroBasico', 'RelatorioPreliminarService.java');
let rpsContent = fs.readFileSync(relatorioPreliminarServicePath, 'utf8');

// Patch updateCollections preliminares
const rpsPreliminaresTarget = `        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioPreliminarInformacao incoming : dto.getPreliminares()) {`;
const rpsPreliminaresReplace = `        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemPreliminar = 0;
            for (RelatorioPreliminarInformacao incoming : dto.getPreliminares()) {
                incoming.setOrdem(ordemPreliminar++);`;
rpsContent = rpsContent.replace(rpsPreliminaresTarget, rpsPreliminaresReplace);

const rpsPreliminaresExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                    } else {`;
const rpsPreliminaresExistingReplace = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {`;
rpsContent = rpsContent.replace(rpsPreliminaresExisting, rpsPreliminaresExistingReplace);

// Patch updateCollections constatacoes
const rpsConstatacoesTarget = `        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioPreliminarConstatacao incoming : dto.getConstatacoes()) {`;
const rpsConstatacoesReplace = `        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemConstatacao = 0;
            for (RelatorioPreliminarConstatacao incoming : dto.getConstatacoes()) {
                incoming.setOrdem(ordemConstatacao++);`;
rpsContent = rpsContent.replace(rpsConstatacoesTarget, rpsConstatacoesReplace);

const rpsConstatacoesExisting = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                    } else {`;
const rpsConstatacoesExistingReplace = `                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {`;
rpsContent = rpsContent.replace(rpsConstatacoesExisting, rpsConstatacoesExistingReplace);

fs.writeFileSync(relatorioPreliminarServicePath, rpsContent, 'utf8');
console.log('Patched RelatorioPreliminarService');
