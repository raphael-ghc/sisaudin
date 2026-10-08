package sisaudin.service.cadastroBasico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import sisaudin.dto.response.cadastroBasico.GerenciaResponse;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.repository.cadastroBasico.GerenciaRepository;

@Service
public class GerenciaService {

    @Autowired
    private GerenciaRepository repository;

    public GerenciaResponse<Page<Gerencia>> getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Gerencia> gerencias = repository.findAll(pageable);
            return new GerenciaResponse<>(true, gerencias, null);
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar buscar gerências: " + e.getMessage());
        }
    }

    public GerenciaResponse<Gerencia> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(gerencia -> new GerenciaResponse<>(true, gerencia, null))
                    .orElse(new GerenciaResponse<>(false, null, "Gerência não encontrada with ID: " + id));
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar recuperar dados da gerência: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> create(Gerencia createdObj) {
        try {
            createdObj.setNome(createdObj.getNome());
            createdObj.setSigla(createdObj.getSigla().toUpperCase());
            createdObj.setStatus(createdObj.getStatus());
            createdObj.setUnidade(createdObj.getUnidade());
            
            // Aplica a regra para garantir unicidade do gerente
            aplicarRegraDeGerente(createdObj, createdObj.getGerente());

            Gerencia created = repository.save(createdObj);
            return new GerenciaResponse<>(true, created, null);
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar criar gerência: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> putUpdate(Long id, Gerencia updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        existingObj.setSigla(updatedObj.getSigla().toUpperCase());
                        existingObj.setStatus(updatedObj.getStatus());
                        existingObj.setUnidade(updatedObj.getUnidade());
                        
                        // Aplica a regra para garantir unicidade do gerente
                        aplicarRegraDeGerente(existingObj, updatedObj.getGerente());

                        repository.save(existingObj);
                        return new GerenciaResponse<>(true, existingObj, null);
                    }).orElse(new GerenciaResponse<>(false, null, "Gerência não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> patchUpdate(Long id, Gerencia updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        if (updatedObj.getNome() != null) existingObj.setNome(updatedObj.getNome());
                        if (updatedObj.getSigla() != null) existingObj.setSigla(updatedObj.getSigla());
                        if (updatedObj.getStatus() != null) existingObj.setStatus(updatedObj.getStatus());
                        if (updatedObj.getUnidade() != null) existingObj.setUnidade(updatedObj.getUnidade());
                        
                        // Atualiza o gerente caso tenha sido enviado no PATCH
                        if (updatedObj.getGerente() != null) {
                            aplicarRegraDeGerente(existingObj, updatedObj.getGerente());
                        }

                        repository.save(existingObj);
                        return new GerenciaResponse<>(true, existingObj, null);
                    })
                    .orElse(new GerenciaResponse<>(false, null, "Gerência não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    public GerenciaResponse<Gerencia> getBySigla(String sigla) {
        try {
            Gerencia gerencia = repository.findBySigla(sigla.toLowerCase());
            if (gerencia == null) {
                return new GerenciaResponse<>(false, null, "Gerência não encontrada");
            }
            return new GerenciaResponse<>(true, gerencia, null);
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar buscar dados da gerência: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> putUpdate(String sigla, Gerencia updatedObj) {
        try {
            Gerencia existingObj = repository.findBySigla(sigla.toLowerCase());
            if (existingObj == null) {
                return new GerenciaResponse<>(false, null, "Gerência não encontrada");
            }

            existingObj.setNome(updatedObj.getNome());
            existingObj.setSigla(updatedObj.getSigla());
            existingObj.setUnidade(updatedObj.getUnidade());
            existingObj.setStatus(updatedObj.getStatus());
            
            // Aplica a regra para garantir unicidade do gerente
            aplicarRegraDeGerente(existingObj, updatedObj.getGerente());

            repository.save(existingObj);
            return new GerenciaResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> patchUpdate(String sigla, Gerencia updatedObj) {
        try {
            Gerencia existingObj = repository.findBySigla(sigla.toLowerCase());
            if (existingObj == null) {
                return new GerenciaResponse<>(false, null, "Gerência não encontrada");
            }

            if (updatedObj.getNome() != null)
                existingObj.setNome(updatedObj.getNome());
            if (updatedObj.getSigla() != null)
                existingObj.setSigla(updatedObj.getSigla().toUpperCase());
            if (updatedObj.getStatus() != null)
                existingObj.setStatus(updatedObj.getStatus());
            if (updatedObj.getUnidade() != null)
                existingObj.setUnidade(updatedObj.getUnidade());
            
            // Atualiza o gerente caso tenha sido enviado no PATCH
            if (updatedObj.getGerente() != null) {
                aplicarRegraDeGerente(existingObj, updatedObj.getGerente());
            }

            repository.save(existingObj);
            return new GerenciaResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Falha ao tentar atualizar: " + e.getMessage());
        }
    }

    @Transactional
    public GerenciaResponse<Gerencia> delete(Long id) {
        Optional<Gerencia> item = repository.findById(id);
        
        if (item.isEmpty()) {
            return new GerenciaResponse<>(false, null, "Gerência não encontrada.");
        }

        try {
            // Se houver regras de validação antes de deletar, coloque aqui            
            repository.deleteById(id);
            return new GerenciaResponse<>(true, null, null);
            
        } catch (Exception e) {
            return new GerenciaResponse<>(false, null, "Erro ao excluir a gerência: " + e.getMessage());
        }
    }

    // =========================================================================
    // MÉTODOS PRIVADOS E REGRAS DE NEGÓCIO
    // =========================================================================

    /**
     * Aplica a regra: "Uma pessoa só pode ser gerente de UMA gerência por vez".
     * Se a pessoa indicada já for gerente de outro setor, ela perde a chefia antiga.
     */
    private void aplicarRegraDeGerente(Gerencia gerenciaAlvo, Pessoa novoGerente) {
        if (novoGerente != null && novoGerente.getId() != null) {
            // Busca se esse novo gerente já chefia outra gerência
            Optional<Gerencia> gerenciaAntigaOpt = repository.findByGerente(novoGerente);

            if (gerenciaAntigaOpt.isPresent()) {
                Gerencia gerenciaAntiga = gerenciaAntigaOpt.get();
                
                // Verifica se a gerência antiga é diferente da gerência que estamos editando agora
                if (gerenciaAlvo.getId() == null || !gerenciaAntiga.getId().equals(gerenciaAlvo.getId())) {
                    // Remove o cargo da gerência antiga
                    gerenciaAntiga.setGerente(null);
                    repository.save(gerenciaAntiga);
                }
            }
        }
        
        // Aplica o novo gerente na gerência atual
        gerenciaAlvo.setGerente(novoGerente);
    }
}


