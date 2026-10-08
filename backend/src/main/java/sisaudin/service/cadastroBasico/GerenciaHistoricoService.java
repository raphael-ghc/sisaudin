package sisaudin.service.cadastroBasico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import sisaudin.dto.response.cadastroBasico.GerenciaHistoricoResponse;
import sisaudin.model.cadastroBasico.GerenciaHistorico;
import sisaudin.repository.cadastroBasico.GerenciaHistoricoRepository;

@Service
public class GerenciaHistoricoService {

    @Autowired
    private GerenciaHistoricoRepository repository;

    public GerenciaHistoricoResponse<Page<GerenciaHistorico>> getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<GerenciaHistorico> gerenciaHistoricos = repository.findAll(pageable);
            return new GerenciaHistoricoResponse<>(true, gerenciaHistoricos, null);
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar buscar gerências: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(gerenciaHistorico -> new GerenciaHistoricoResponse<>(true, gerenciaHistorico, null))
                    .orElse(new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada with ID: " + id));
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar recuperar dados da gerência: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> create(GerenciaHistorico createdObj) {
        try {
            createdObj.setGerencia(createdObj.getGerencia());
            createdObj.setGerente(createdObj.getGerente());
            createdObj.setDataInicio(createdObj.getDataInicio());
            createdObj.setDataFim(createdObj.getDataFim());
            createdObj.setPortariaNomeacao(createdObj.getPortariaNomeacao());

            GerenciaHistorico created = repository.save(createdObj);
            return new GerenciaHistoricoResponse<>(true, created, null);
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar criar gerência: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> putUpdate(Long id, GerenciaHistorico updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setGerencia(existingObj.getGerencia());
                        existingObj.setGerente(existingObj.getGerente());
                        existingObj.setDataInicio(existingObj.getDataInicio());
                        existingObj.setDataFim(existingObj.getDataFim());
                        existingObj.setPortariaNomeacao(existingObj.getPortariaNomeacao());

                        repository.save(existingObj);

                        return new GerenciaHistoricoResponse<>(true, existingObj, null);
                    }).orElse(new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> patchUpdate(Long id, GerenciaHistorico updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {                        
                        existingObj.setGerencia(existingObj.getGerencia());
                        existingObj.setGerente(existingObj.getGerente());
                        existingObj.setDataInicio(existingObj.getDataInicio());
                        existingObj.setDataFim(existingObj.getDataFim());
                        existingObj.setPortariaNomeacao(existingObj.getPortariaNomeacao());

                        repository.save(existingObj);
                        return new GerenciaHistoricoResponse<>(true, existingObj, null);
                    })
                    .orElse(new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    /*public GerenciaHistoricoResponse<GerenciaHistorico> getBySigla(Gerencia gerencia) {
        try {
            GerenciaHistorico gerenciaHistorico = repository.findByGerencia(gerencia);
            if (gerenciaHistorico == null) {
                return new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada");
            }
            return new GerenciaHistoricoResponse<>(true, gerenciaHistorico, null);
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar buscar dados da gerência: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> putUpdate(Gerencia gerencia, GerenciaHistorico updatedObj) {
        try {
            GerenciaHistorico existingObj = repository.findByGerencia(gerencia);
            if (existingObj == null) {
                return new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada");
            }

            existingObj.setGerencia(updatedObj.getGerencia());
            existingObj.setGerente(updatedObj.getGerente());
            existingObj.setDataInicio(updatedObj.getDataInicio());
            existingObj.setDataFim(updatedObj.getDataFim());
            existingObj.setPortariaNomeacao(updatedObj.getPortariaNomeacao());

            repository.save(existingObj);
            return new GerenciaHistoricoResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar atualizar gerência: " + e.getMessage());
        }
    }

    public GerenciaHistoricoResponse<GerenciaHistorico> patchUpdate(Gerencia gerencia, GerenciaHistorico updatedObj) {
        try {
            GerenciaHistorico existingObj = repository.findByGerencia(gerencia);
            if (existingObj == null) {
                return new GerenciaHistoricoResponse<>(false, null, "Gerência não encontrada");
            }

            if (updatedObj.getGerencia() != null)
                existingObj.setGerencia(updatedObj.getGerencia());            
            if (updatedObj.getGerente() != null)
                existingObj.setGerente(updatedObj.getGerente());
            if (updatedObj.getDataInicio() != null)
                existingObj.setDataInicio(updatedObj.getDataInicio());
            if (updatedObj.getDataFim() != null)
                existingObj.setDataFim(updatedObj.getDataFim());
            if (updatedObj.getPortariaNomeacao() != null)
                existingObj.setPortariaNomeacao(updatedObj.getPortariaNomeacao());

            repository.save(existingObj);
            return new GerenciaHistoricoResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new GerenciaHistoricoResponse<>(false, null, "Falha ao tentar atualizar: " + e.getMessage());
        }
    }*/

    
    @Transactional
    public GerenciaHistoricoResponse<GerenciaHistorico> delete(Long id) {
        Optional<GerenciaHistorico> item = repository.findById(id);
        
        // Cenário de Erro: T não encontrada
        if (item.isEmpty()) {
            // success = false | data = null | error = "Mensagem"
            return new GerenciaHistoricoResponse<GerenciaHistorico>(false, null, "GerenciaHistorico não encontrada.");
        }

        //T item = itemOptional.get();

        // Cenário de Erro: Validação de chave estrangeira
        //if (item.getTrabalhosAssociados() > 0) { 
        //    return new BaseResponse<>(false, null, "Não é possível excluir esta item porque existem trabalhos associados a ela.");
        //}

        try {
            repository.deleteById(id);
            
            // Cenário de Sucesso: Deletou corretamente
            // success = true | data = null | error = null
            return new GerenciaHistoricoResponse<GerenciaHistorico>(true, null, null);
            
        } catch (Exception e) {
            // Cenário de Erro: Falha no banco de dados
            return new GerenciaHistoricoResponse<GerenciaHistorico>(false, null, "Erro ao excluir a gerenciaHistorico: " + e.getMessage());
        }
    }


}