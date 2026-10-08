package sisaudin.service.cadastroBasico.generico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import sisaudin.dto.response.BaseResponse;
import sisaudin.model.cadastroBasico.generico.BaseEntity;
import sisaudin.repository.cadastroBasico.generico.BaseRepository;

public abstract class BaseService<T extends BaseEntity> {
    
    @Autowired
    protected BaseRepository<T> repository;


    public BaseResponse<Page<T>> findAll(int page, int size) {
        try {
            // 1. Cria o objeto de paginação (Spring Data usa índice 0 para a primeira página)
            PageRequest pageable = PageRequest.of(page, size);
            
            // 2. Chama o método correto do JpaRepository que aceita Pageable
            Page<T> itens = repository.findAll(pageable);
            
            return new BaseResponse<>(true, itens, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to fetch data: " + e.getMessage());
        }
    }


    /*public List<T> findAll() { return repository.findAll(); }
    public Optional<T> findById(Long id) { return repository.findById(id); }
    public T save(T entity) { return repository.save(entity); }
    public void deleteById(Long id) { repository.deleteById(id); }*/




    
    public BaseResponse<Page<T>> getAll(int page, int size) {
        try {
            PageRequest pageable = PageRequest.of(page, size);
            Page<T> items = repository.findAll(pageable);
            return new BaseResponse<>(true, items, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to fetch items: " + e.getMessage());
        }
    }

    public BaseResponse<T> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(item -> new BaseResponse<>(true, item, null))
                    .orElse(new BaseResponse<>(false, null, "T not found with ID: " + id));
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to retrieve itemdetails: " + e.getMessage());
        }
    }

    public BaseResponse<T> create(T _created) {
        try {
            _created.setNome(_created.getNome());
            _created.setDescricao(_created.getDescricao());
            _created.setStatus(_created.getStatus());
            T created = repository.save(_created);
            return new BaseResponse<>(true, created, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to create itemdetails: " + e.getMessage());
        }
    }

    public BaseResponse<T> putUpdate(Long id, T updated) {
        try {
            return repository.findById(id)
                    .map(existing -> {
                        existing.setNome(updated.getNome());
                        existing.setDescricao(updated.getDescricao());
                        existing.setStatus(updated.getStatus());

                        repository.save(existing);

                        return new BaseResponse<>(true, existing, null);
                    }).orElse(new BaseResponse<>(false, null, "T not found to update"));
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to update itemdetails: " + e.getMessage());
        }
    }

    public BaseResponse<T> patchUpdate(Long id, T updated) {
        try {
            return repository.findById(id)
                    .map(existing -> {
                        existing.setNome(updated.getNome());
                        existing.setDescricao(updated.getDescricao());
                        existing.setStatus(updated.getStatus());

                        repository.save(existing);
                        return new BaseResponse<>(true, existing, null);
                    })
                    .orElse(new BaseResponse<>(false, null, "T not found to update"));
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to update itemdetails: " + e.getMessage());
        }
    }

    public BaseResponse<T> getByNome(String itemname) {
        try {
            T item = repository.findByNome(itemname.toLowerCase());
            if (item == null) {
                return new BaseResponse<>(false, null, "T not found");
            }
            return new BaseResponse<>(true, item, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to fetch itemdetails: " + e.getMessage());
        }
    }

    public BaseResponse<T> putUpdateProfile(String itemname, T updated) {
        try {
            T existing = repository.findByNome(itemname.toLowerCase());
            if (existing == null) {
                return new BaseResponse<>(false, null, "T not found");
            }

            existing.setNome(updated.getNome());
            existing.setDescricao(updated.getDescricao());
            existing.setStatus(updated.getStatus());


            repository.save(existing);
            return new BaseResponse<>(true, existing, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to update profile: " + e.getMessage());
        }
    }

    public BaseResponse<T> patchUpdateProfile(String itemname, T updated) {
        try {
            T existing = repository.findByNome(itemname.toLowerCase());
            if (existing == null) {
                return new BaseResponse<>(false, null, "T not found");
            }

            if (updated.getNome() != null)
                existing.setNome(updated.getNome());
            if (updated.getDescricao() != null)
                existing.setDescricao(updated.getDescricao());
            if (updated.getStatus() != null)
                existing.setStatus(updated.getStatus());

            repository.save(existing);
            return new BaseResponse<>(true, existing, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to update profile: " + e.getMessage());
        }
    }



    /* public BaseResponse<T> getByEmail(String email) {
        try {
            T item = repository.findByEmail(email.toLowerCase());
            if (item == null) {
                return new BaseResponse<>(false, null, "T not found");
            }
            return new BaseResponse<>(true, item, null);
        } catch (Exception e) {
            return new BaseResponse<>(false, null, "Failed to fetch itemdetails: " + e.getMessage());
        }
    }*/
       
    @Transactional
    public BaseResponse<Void> delete(Long id) {
        Optional<T> itemOptional = repository.findById(id);
        
        // Cenário de Erro: T não encontrada
        if (itemOptional.isEmpty()) {
            // success = false | data = null | error = "Mensagem"
            return new BaseResponse<>(false, null, "T não encontrada.");
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
            return new BaseResponse<>(true, null, null);
            
        } catch (Exception e) {
            // Cenário de Erro: Falha no banco de dados
            return new BaseResponse<>(false, null, "Erro ao excluir a item: " + e.getMessage());
        }
    }


    
}
