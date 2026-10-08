package sisaudin.service.cadastroBasico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import sisaudin.dto.DocumentoStatusDTO;
import sisaudin.dto.TransitarStatusRequestDTO;
import sisaudin.dto.response.cadastroBasico.ItemTrabalhoResponse;
import sisaudin.model.cadastroBasico.HistoricoStatus;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.repository.cadastroBasico.HistoricoStatusRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import java.util.List;

@Service
public class ItemTrabalhoService {

    @Autowired
    private ItemTrabalhoRepository repository;

    @Autowired
    private PessoaRepository pessoaRepository;
    
    @Autowired
    private HistoricoStatusRepository historicoRepository;

    @Transactional(readOnly = true)
    public ItemTrabalhoResponse<Page<ItemTrabalho>> getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ItemTrabalho> itens = repository.findAll(pageable);
            return new ItemTrabalhoResponse<>(true, itens, null);
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Falha ao tentar buscar itens de trabalho: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public ItemTrabalhoResponse<ItemTrabalho> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(item -> new ItemTrabalhoResponse<>(true, item, null))
                    .orElse(new ItemTrabalhoResponse<>(false, null, "Item de Trabalho não encontrado com ID: " + id));
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Falha ao tentar recuperar dados do item de trabalho: " + e.getMessage());
        }
    }

    @Transactional
    public ItemTrabalhoResponse<ItemTrabalho> create(ItemTrabalho createdObj) {
        try {
            if (createdObj.getSigla() != null) {
                createdObj.setSigla(createdObj.getSigla().toUpperCase());
            }
            ItemTrabalho created = repository.save(createdObj);
            return new ItemTrabalhoResponse<>(true, created, null);
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Falha ao tentar criar item de trabalho: " + e.getMessage());
        }
    }

    @Transactional
    public ItemTrabalhoResponse<ItemTrabalho> putUpdate(Long id, ItemTrabalho updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        if (updatedObj.getSigla() != null) {
                            existingObj.setSigla(updatedObj.getSigla().toUpperCase());
                        }
                        existingObj.setStatus(updatedObj.getStatus());
                        existingObj.setAnoReferencia(updatedObj.getAnoReferencia());
                        existingObj.setNumeroReferencia(updatedObj.getNumeroReferencia());
                        existingObj.setObjetoAuditado(updatedObj.getObjetoAuditado());
                        existingObj.setObjetivoAuditoria(updatedObj.getObjetivoAuditoria());
                        existingObj.setDataInicialPrevista(updatedObj.getDataInicialPrevista());
                        existingObj.setDataFinalPrevista(updatedObj.getDataFinalPrevista());
                        existingObj.setHorasPrevistas(updatedObj.getHorasPrevistas());
                        existingObj.setTipoItem(updatedObj.getTipoItem());
                        existingObj.setTipoServico(updatedObj.getTipoServico());
                        existingObj.setMacroprocesso(updatedObj.getMacroprocesso());
                        existingObj.setOrigem(updatedObj.getOrigem());
                        existingObj.setNivelRisco(updatedObj.getNivelRisco());
                        existingObj.setResponsavel(updatedObj.getResponsavel());
                        existingObj.setSupervisor(updatedObj.getSupervisor());
                        existingObj.setSupervisorTecnico(updatedObj.getSupervisorTecnico());
                        if (updatedObj.getEquipe() != null) {
                            existingObj.getEquipe().clear();
                            existingObj.getEquipe().addAll(updatedObj.getEquipe());
                        }

                        repository.save(existingObj);
                        return new ItemTrabalhoResponse<>(true, existingObj, null);
                    }).orElse(new ItemTrabalhoResponse<>(false, null, "Item de Trabalho não encontrado para poder atualizar"));
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Falha ao tentar atualizar item de trabalho: " + e.getMessage());
        }
    }

    @Transactional
    public ItemTrabalhoResponse<ItemTrabalho> patchUpdate(Long id, ItemTrabalho updatedObj) {
        // ... (existing code, we keep it but ensure the new methods are added below it)
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        if (updatedObj.getNome() != null) existingObj.setNome(updatedObj.getNome());
                        if (updatedObj.getSigla() != null) existingObj.setSigla(updatedObj.getSigla().toUpperCase());
                        if (updatedObj.getStatus() != null) existingObj.setStatus(updatedObj.getStatus());
                        if (updatedObj.getAnoReferencia() != null) existingObj.setAnoReferencia(updatedObj.getAnoReferencia());
                        if (updatedObj.getNumeroReferencia() != null) existingObj.setNumeroReferencia(updatedObj.getNumeroReferencia());
                        if (updatedObj.getObjetoAuditado() != null) existingObj.setObjetoAuditado(updatedObj.getObjetoAuditado());
                        if (updatedObj.getObjetivoAuditoria() != null) existingObj.setObjetivoAuditoria(updatedObj.getObjetivoAuditoria());
                        if (updatedObj.getDataInicialPrevista() != null) existingObj.setDataInicialPrevista(updatedObj.getDataInicialPrevista());
                        if (updatedObj.getDataFinalPrevista() != null) existingObj.setDataFinalPrevista(updatedObj.getDataFinalPrevista());
                        if (updatedObj.getHorasPrevistas() != null) existingObj.setHorasPrevistas(updatedObj.getHorasPrevistas());
                        if (updatedObj.getTipoItem() != null) existingObj.setTipoItem(updatedObj.getTipoItem());
                        if (updatedObj.getTipoServico() != null) existingObj.setTipoServico(updatedObj.getTipoServico());
                        if (updatedObj.getMacroprocesso() != null) existingObj.setMacroprocesso(updatedObj.getMacroprocesso());
                        if (updatedObj.getOrigem() != null) existingObj.setOrigem(updatedObj.getOrigem());
                        if (updatedObj.getNivelRisco() != null) existingObj.setNivelRisco(updatedObj.getNivelRisco());
                        if (updatedObj.getResponsavel() != null) existingObj.setResponsavel(updatedObj.getResponsavel());
                        if (updatedObj.getSupervisor() != null) existingObj.setSupervisor(updatedObj.getSupervisor());
                        if (updatedObj.getSupervisorTecnico() != null) existingObj.setSupervisorTecnico(updatedObj.getSupervisorTecnico());
                        if (updatedObj.getEquipe() != null) {
                            existingObj.getEquipe().clear();
                            existingObj.getEquipe().addAll(updatedObj.getEquipe());
                        }

                        repository.save(existingObj);
                        return new ItemTrabalhoResponse<>(true, existingObj, null);
                    })
                    .orElse(new ItemTrabalhoResponse<>(false, null, "Item de Trabalho não encontrado para poder atualizar"));
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Falha ao tentar atualizar item de trabalho: " + e.getMessage());
        }
    }

    @Transactional
    public ItemTrabalhoResponse<ItemTrabalho> delete(Long id) {
        Optional<ItemTrabalho> item = repository.findById(id);
        
        if (item.isEmpty()) {
            return new ItemTrabalhoResponse<>(false, null, "Item de Trabalho não encontrado.");
        }

        try {
            repository.deleteById(id);
            return new ItemTrabalhoResponse<>(true, null, null);
        } catch (Exception e) {
            return new ItemTrabalhoResponse<>(false, null, "Erro ao excluir o item de trabalho: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public sisaudin.model.cadastroBasico.Pessoa getPessoaFromAuth(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return pessoaRepository.findByEmail("admin@ghc.com.br");
        }
        sisaudin.model.cadastroBasico.Pessoa user = pessoaRepository.findByEmail(auth.getName());
        return user != null ? user : pessoaRepository.findByEmail("admin@ghc.com.br");
    }

    @Transactional(readOnly = true)
    public DocumentoStatusDTO getHistoricoStatus(Long id, Authentication authentication) {
        ItemTrabalho doc = repository.findById(id).orElseThrow();
        if (doc.getStatus() == null || doc.getStatus().trim().isEmpty()) {
            doc.setStatus("Minuta");
            repository.save(doc);
        }

        List<HistoricoStatus> hist = historicoRepository.findByDocumentoTipoAndDocumentoIdOrderByDataHoraDesc("ITEM_TRABALHO", id);

        sisaudin.model.cadastroBasico.Pessoa currentUser = getPessoaFromAuth(authentication);
        boolean podeEditar = true;
        if ("Aprovado".equalsIgnoreCase(doc.getStatus())) {
            podeEditar = isGestorOrAdmin(currentUser);
        }

        return DocumentoStatusDTO.builder()
                .documentoTipo("ITEM_TRABALHO")
                .documentoId(id)
                .statusAtual(doc.getStatus())
                .podeEditar(podeEditar)
                .historico(hist)
                .checklistRevisao(new java.util.ArrayList<>())
                .checklistAprovacao(new java.util.ArrayList<>())
                .build();
    }

    @Transactional
    public DocumentoStatusDTO transitarStatus(Long id, TransitarStatusRequestDTO dto, Authentication authentication) {
        ItemTrabalho doc = repository.findById(id).orElseThrow();
        String statusAnterior = doc.getStatus() != null ? doc.getStatus() : "Minuta";
        String statusNovo = dto.getNovoStatus();

        sisaudin.model.cadastroBasico.Pessoa currentUser = getPessoaFromAuth(authentication);

        if ("Aprovado".equalsIgnoreCase(statusAnterior) && !isGestorOrAdmin(currentUser)) {
            throw new IllegalArgumentException("Este documento já foi aprovado. Somente utilizadores com perfil de Gestor podem alterá-lo.");
        }

        doc.setStatus(statusNovo);
        repository.save(doc);

        sisaudin.model.cadastroBasico.Pessoa dest = null;
        if (dto.getUsuarioDestinatarioId() != null) {
            dest = pessoaRepository.findById(dto.getUsuarioDestinatarioId()).orElse(null);
        }

        HistoricoStatus hist = HistoricoStatus.builder()
                .documentoId(id)
                .documentoTipo("ITEM_TRABALHO")
                .statusAnterior(statusAnterior)
                .statusNovo(statusNovo)
                .dataHora(java.time.LocalDateTime.now())
                .usuario(currentUser)
                .usuarioDestinatario(dest)
                .justificativaExcecao(dto.getJustificativaExcecao())
                .observacoes(dto.getObservacoes())
                .build();
        historicoRepository.save(hist);

        return getHistoricoStatus(id, authentication);
    }

    private boolean isGestorOrAdmin(sisaudin.model.cadastroBasico.Pessoa user) {
        if (user == null || user.getRole() == null) return true;
        String role = user.getRole().name().toUpperCase();
        return role.contains("GESTOR") || role.contains("SISTEMA") || role.contains("ADMIN");
    }
}
