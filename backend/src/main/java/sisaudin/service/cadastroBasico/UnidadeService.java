package sisaudin.service.cadastroBasico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import sisaudin.dto.response.cadastroBasico.UnidadeResponse;
import sisaudin.model.cadastroBasico.Unidade;
import sisaudin.repository.cadastroBasico.UnidadeRepository;

@Service
public class UnidadeService {

    @Autowired
    private UnidadeRepository repository;

    public UnidadeResponse<Page<Unidade>> getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Unidade> unidades = repository.findAll(pageable);
            return new UnidadeResponse<>(true, unidades, null);
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar buscar unidades: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(unidade -> new UnidadeResponse<>(true, unidade, null))
                    .orElse(new UnidadeResponse<>(false, null, "Unidade não encontrada with ID: " + id));
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar recuperar dados da unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> create(Unidade createdObj) {
        try {
            createdObj.setNome(createdObj.getNome());
            createdObj.setSigla(createdObj.getSigla().toUpperCase());
            createdObj.setCnpj(createdObj.getCnpj());
            createdObj.setStatus(createdObj.getStatus());

            Unidade created = repository.save(createdObj);
            return new UnidadeResponse<>(true, created, null);
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar criar unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> putUpdate(Long id, Unidade updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        existingObj.setSigla(updatedObj.getSigla().toUpperCase());
                        existingObj.setCnpj(updatedObj.getCnpj());
                        existingObj.setStatus(updatedObj.getStatus());

                        repository.save(existingObj);

                        return new UnidadeResponse<>(true, existingObj, null);
                    }).orElse(new UnidadeResponse<>(false, null, "Unidade não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar atualizar unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> patchUpdate(Long id, Unidade updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        existingObj.setSigla(updatedObj.getSigla() != null ? updatedObj.getSigla().toUpperCase() : existingObj.getSigla().toUpperCase());
                        existingObj.setCnpj(updatedObj.getCnpj());
                        existingObj.setStatus(updatedObj.getStatus());

                        repository.save(existingObj);
                        return new UnidadeResponse<>(true, existingObj, null);
                    })
                    .orElse(new UnidadeResponse<>(false, null, "Unidade não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar atualizar unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> getBySigla(String sigla) {
        try {
            Unidade unidade = repository.findBySigla(sigla.toLowerCase());
            if (unidade == null) {
                return new UnidadeResponse<>(false, null, "Unidade não encontrada");
            }
            return new UnidadeResponse<>(true, unidade, null);
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar buscar dados da unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> putUpdate(String sigla, Unidade updatedObj) {
        try {
            Unidade existingObj = repository.findBySigla(sigla.toLowerCase());
            if (existingObj == null) {
                return new UnidadeResponse<>(false, null, "Unidade não encontrada");
            }

            existingObj.setNome(updatedObj.getNome());
            existingObj.setSigla(updatedObj.getSigla().toUpperCase());
            existingObj.setCnpj(updatedObj.getCnpj());
            existingObj.setStatus(updatedObj.getStatus());

            repository.save(existingObj);
            return new UnidadeResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar atualizar unidade: " + e.getMessage());
        }
    }

    public UnidadeResponse<Unidade> patchUpdate(String sigla, Unidade updatedObj) {
        try {
            Unidade existingObj = repository.findBySigla(sigla.toLowerCase());
            if (existingObj == null) {
                return new UnidadeResponse<>(false, null, "Unidade não encontrada");
            }

            if (updatedObj.getNome() != null)
                existingObj.setNome(updatedObj.getNome());
            if (updatedObj.getSigla() != null)
                existingObj.setSigla(updatedObj.getSigla().toUpperCase());
            if (updatedObj.getCnpj() != null)
                existingObj.setCnpj(updatedObj.getCnpj());
            if (updatedObj.getStatus() != null)
                existingObj.setStatus(updatedObj.getStatus());

            repository.save(existingObj);
            return new UnidadeResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new UnidadeResponse<>(false, null, "Falha ao tentar atualizar: " + e.getMessage());
        }
    }

    
    @Transactional
    public UnidadeResponse<Unidade> delete(Long id) {
        Optional<Unidade> item = repository.findById(id);
        
        // Cenário de Erro: T não encontrada
        if (item.isEmpty()) {
            // success = false | data = null | error = "Mensagem"
            return new UnidadeResponse<Unidade>(false, null, "Unidade não encontrada.");
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
            return new UnidadeResponse<Unidade>(true, null, null);
            
        } catch (Exception e) {
            // Cenário de Erro: Falha no banco de dados
            return new UnidadeResponse<Unidade>(false, null, "Erro ao excluir a unidade: " + e.getMessage());
        }
    }


}