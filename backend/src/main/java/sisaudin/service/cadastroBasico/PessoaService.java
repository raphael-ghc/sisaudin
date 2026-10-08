package sisaudin.service.cadastroBasico;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import sisaudin.dto.response.cadastroBasico.PessoaResponse;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.model.cadastroBasico.generico.Cargo;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import sisaudin.repository.cadastroBasico.generico.CargoRepository;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import sisaudin.events.UserRegistradoEvent;

@Service
public class PessoaService {

    @Autowired
    private PessoaRepository repository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public PessoaResponse<Page<Pessoa>> getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Pessoa> pessoas = repository.findAll(pageable);
            return new PessoaResponse<>(true, pessoas, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar buscar pessoas: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> getById(Long id) {
        try {
            return repository.findById(id)
                    .map(pessoa -> new PessoaResponse<>(true, pessoa, null))
                    .orElse(new PessoaResponse<>(false, null, "Pessoa não encontrada with ID: " + id));
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar recuperar dados da pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> getByEmail(String email) {
        try {
            Pessoa pessoa = repository.findByEmail(email);
            if (pessoa == null) {
                return new PessoaResponse<>(false, null, "Pessoa não encontrada with email: " + email);
            }
            return new PessoaResponse<>(true, pessoa, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar recuperar dados da pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> create(Pessoa createdObj) {
        try {
            /*createdObj.setNome(createdObj.getNome());
            createdObj.setCartaoPonto(createdObj.getCartaoPonto());
            createdObj.setEmail(createdObj.getEmail());
            createdObj.setStatus(createdObj.getStatus());
            createdObj.setGerencia(createdObj.getGerencia());*/

            // 2. Associa a gerência de lotação
            if (createdObj.getGerencia() != null && createdObj.getGerencia().getId() != null) {
                Gerencia gerencia = gerenciaRepository.findById(createdObj.getGerencia().getId()).orElseThrow();
                createdObj.setGerencia(gerencia);
            }

            if (createdObj.getCargo() != null && createdObj.getCargo().getId() != null) {
                Cargo cargo = cargoRepository.findById(createdObj.getCargo().getId()).orElseThrow();
                createdObj.setCargo(cargo);
            }

             //Verificar validações anteriores
            aplicarValidacoes(createdObj, createdObj.getIsGerente());

            // Verifica se é usuário do sistema
            if (Boolean.TRUE.equals(createdObj.getUsuario())) {
                if (createdObj.getPassword() != null && !createdObj.getPassword().trim().isEmpty()) {
                    createdObj.setPassword(passwordEncoder.encode(createdObj.getPassword()));
                }
            } else {
                createdObj.setPassword(null);
            }
                       
            Pessoa created = repository.save(createdObj);
            
            // 4. Aplica a Regra de Negócio de Gerência
            aplicarRegraDeGerente(createdObj, createdObj.getIsGerente());

            // 5. Dispara email se for usuário
            if (Boolean.TRUE.equals(created.getUsuario())) {
                eventPublisher.publishEvent(new UserRegistradoEvent(this, created.getEmail(), created.getNome()));
            }

            return new PessoaResponse<>(true, created, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar criar pessoa: " + e.getMessage());
        }
    }

    private PessoaResponse<Pessoa> aplicarValidacoes(Pessoa pessoa, Boolean isGerentePeloFrontend) {
        if (pessoa.getGerencia() == null){
            return new PessoaResponse<>(false, null, "A gerência está nula");
        } 

        Gerencia gerencia = pessoa.getGerencia();

        //verificar se a gerência já tem um gerente designado
        if(gerencia.getGerente()!=null && gerencia.getGerente().getId() != pessoa.getId()){
            //a gerência já tem um gerente que é outra pessoa, então precisa retirar essa pessoa como gerente primeiro para depois designar outra
            return new PessoaResponse<>(false, null, "A gerência já tem '"+gerencia.getGerente().getNome()+"' como gerente. É necessário desvinculá-lo primeiro.");
        }else{
             return new PessoaResponse<>(true, pessoa, null);
        }
    }

    private void aplicarRegraDeGerente(Pessoa pessoa, Boolean isGerentePeloFrontend) {
        if (pessoa.getGerencia() == null) return;

        Gerencia gerencia = pessoa.getGerencia();

        if (Boolean.TRUE.equals(isGerentePeloFrontend)) {
            // Se o frontend disse que ele é o gerente, atualizamos a gerência
            // Se já existia outro gerente, ele automaticamente perde o cargo 
            // porque o gerente_id da gerência vai apontar para a nova Pessoa.
            gerencia.setGerente(pessoa);
            gerenciaRepository.save(gerencia);
        } else {
            // Se o frontend disse que ele NÃO é gerente, verificamos se ele era
            // o gerente atual. Se sim, removemos ele do cargo.
            if (gerencia.getGerente() != null && gerencia.getGerente().getId().equals(pessoa.getId())) {
                gerencia.setGerente(null);
                gerenciaRepository.save(gerencia);
            }
        }
    }

    public PessoaResponse<Pessoa> putUpdate(Long id, Pessoa updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        existingObj.setCartaoPonto(updatedObj.getCartaoPonto());
                        existingObj.setEmail(updatedObj.getEmail());
                        existingObj.setStatus(updatedObj.getStatus());
                        existingObj.setRole(updatedObj.getRole());
                        //existingObj.setGerencia(updatedObj.getGerencia());

                        // 2. Associa a gerência de lotação
                        if (updatedObj.getGerencia() != null && updatedObj.getGerencia().getId() != null) {
                            Gerencia gerencia = gerenciaRepository.findById(updatedObj.getGerencia().getId()).orElseThrow();
                            existingObj.setGerencia(gerencia);
                        }

                        if (updatedObj.getCargo() != null && updatedObj.getCargo().getId() != null) {
                            Cargo cargo = cargoRepository.findById(updatedObj.getCargo().getId()).orElseThrow();
                            existingObj.setCargo(cargo);
                        } else {
                            existingObj.setCargo(null);
                        }

                        boolean wasUser = Boolean.TRUE.equals(existingObj.getUsuario());
                        boolean isUserNow = Boolean.TRUE.equals(updatedObj.getUsuario());
                        existingObj.setUsuario(isUserNow);

                        if (isUserNow) {
                            if (updatedObj.getPassword() != null && !updatedObj.getPassword().trim().isEmpty()) {
                                existingObj.setPassword(passwordEncoder.encode(updatedObj.getPassword()));
                            }
                        }

                        repository.save(existingObj);

                        if (!wasUser && isUserNow) {
                            eventPublisher.publishEvent(new UserRegistradoEvent(this, existingObj.getEmail(), existingObj.getNome()));
                        }

                        // 4. Aplica a Regra de Negócio de Gerência
                        aplicarRegraDeGerente(existingObj, existingObj.getIsGerente());

                        return new PessoaResponse<>(true, existingObj, null);
                    }).orElse(new PessoaResponse<>(false, null, "Pessoa não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar atualizar pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> patchUpdate(Long id, Pessoa updatedObj) {
        try {
            return repository.findById(id)
                    .map(existingObj -> {
                        existingObj.setNome(updatedObj.getNome());
                        existingObj.setCartaoPonto(updatedObj.getCartaoPonto());
                        existingObj.setEmail(updatedObj.getEmail() != null ? updatedObj.getEmail() : existingObj.getEmail());
                        existingObj.setStatus(updatedObj.getStatus());
                        if (updatedObj.getRole() != null) existingObj.setRole(updatedObj.getRole());
                        //existingObj.setGerencia(updatedObj.getGerencia());

                        // 2. Associa a gerência de lotação
                        if (updatedObj.getGerencia() != null && updatedObj.getGerencia().getId() != null) {
                            Gerencia gerencia = gerenciaRepository.findById(updatedObj.getGerencia().getId()).orElseThrow();
                            existingObj.setGerencia(gerencia);
                        }

                        if (updatedObj.getCargo() != null && updatedObj.getCargo().getId() != null) {
                            Cargo cargo = cargoRepository.findById(updatedObj.getCargo().getId()).orElseThrow();
                            existingObj.setCargo(cargo);
                        } else {
                            existingObj.setCargo(null);
                        }

                        boolean wasUser = Boolean.TRUE.equals(existingObj.getUsuario());
                        boolean isUserNow = updatedObj.getUsuario() != null ? updatedObj.getUsuario() : existingObj.getUsuario();
                        existingObj.setUsuario(isUserNow);

                        if (isUserNow) {
                            if (updatedObj.getPassword() != null && !updatedObj.getPassword().trim().isEmpty()) {
                                existingObj.setPassword(passwordEncoder.encode(updatedObj.getPassword()));
                            }
                        }

                        repository.save(existingObj);

                        if (!wasUser && isUserNow) {
                            eventPublisher.publishEvent(new UserRegistradoEvent(this, existingObj.getEmail(), existingObj.getNome()));
                        }
                        
                        // 4. Aplica a Regra de Negócio de Gerência
                        aplicarRegraDeGerente(existingObj, existingObj.getIsGerente());

                        return new PessoaResponse<>(true, existingObj, null);
                    })
                    .orElse(new PessoaResponse<>(false, null, "Pessoa não encontrada para poder atualizar"));
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar atualizar pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> getByCartaoPonto(String cartaoPonto) {
        try {
            Pessoa pessoa = repository.findByCartaoPonto(cartaoPonto);
            if (pessoa == null) {
                return new PessoaResponse<>(false, null, "Pessoa não encontrada");
            }
            return new PessoaResponse<>(true, pessoa, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar buscar dados da pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> putUpdate(String cartaoPonto, Pessoa updatedObj) {
        try {
            Pessoa existingObj = repository.findByCartaoPonto(cartaoPonto.toLowerCase());
            if (existingObj == null) {
                return new PessoaResponse<>(false, null, "Pessoa não encontrada");
            }

            existingObj.setNome(updatedObj.getNome());
            existingObj.setCartaoPonto(updatedObj.getCartaoPonto());
            existingObj.setEmail(updatedObj.getEmail());
            //existingObj.setGerencia(updatedObj.getGerencia());
            existingObj.setStatus(updatedObj.getStatus());
            existingObj.setRole(updatedObj.getRole());

             // 2. Associa a gerência de lotação
            if (updatedObj.getGerencia() != null && updatedObj.getGerencia().getId() != null) {
                Gerencia gerencia = gerenciaRepository.findById(updatedObj.getGerencia().getId()).orElseThrow();
                existingObj.setGerencia(gerencia);
            }

            if (updatedObj.getCargo() != null && updatedObj.getCargo().getId() != null) {
                Cargo cargo = cargoRepository.findById(updatedObj.getCargo().getId()).orElseThrow();
                existingObj.setCargo(cargo);
            } else {
                existingObj.setCargo(null);
            }

            repository.save(existingObj);
            
            // 4. Aplica a Regra de Negócio de Gerência
            aplicarRegraDeGerente(existingObj, existingObj.getIsGerente());

            return new PessoaResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar atualizar pessoa: " + e.getMessage());
        }
    }

    public PessoaResponse<Pessoa> patchUpdate(String cartaoPonto, Pessoa updatedObj) {
        try {
            Pessoa existingObj = repository.findByCartaoPonto(cartaoPonto.toLowerCase());
            if (existingObj == null) {
                return new PessoaResponse<>(false, null, "Pessoa não encontrada");
            }

            if (updatedObj.getNome() != null)
                existingObj.setNome(updatedObj.getNome());
            if (updatedObj.getCartaoPonto() != null)
                existingObj.setEmail(updatedObj.getCartaoPonto());
            if (updatedObj.getEmail() != null)
                existingObj.setEmail(updatedObj.getEmail());
            if (updatedObj.getStatus() != null)
                existingObj.setStatus(updatedObj.getStatus());
            if (updatedObj.getRole() != null)
                existingObj.setRole(updatedObj.getRole());
            //if (updatedObj.getGerencia() != null)
            //    existingObj.setGerencia(updatedObj.getGerencia());

             // 2. Associa a gerência de lotação
            if (updatedObj.getGerencia() != null && updatedObj.getGerencia().getId() != null) {
                Gerencia gerencia = gerenciaRepository.findById(updatedObj.getGerencia().getId()).orElseThrow();
                existingObj.setGerencia(gerencia);
            }

            if (updatedObj.getCargo() != null && updatedObj.getCargo().getId() != null) {
                Cargo cargo = cargoRepository.findById(updatedObj.getCargo().getId()).orElseThrow();
                existingObj.setCargo(cargo);
            } else {
                existingObj.setCargo(null);
            }

            repository.save(existingObj);

            
            // 4. Aplica a Regra de Negócio de Gerência
            aplicarRegraDeGerente(existingObj, existingObj.getIsGerente());

            return new PessoaResponse<>(true, existingObj, null);
        } catch (Exception e) {
            return new PessoaResponse<>(false, null, "Falha ao tentar atualizar: " + e.getMessage());
        }
    }

    
    @Transactional
    public PessoaResponse<Pessoa> delete(Long id) {
        Optional<Pessoa> item = repository.findById(id);
        
        // Cenário de Erro: T não encontrada
        if (item.isEmpty()) {
            // success = false | data = null | error = "Mensagem"
            return new PessoaResponse<Pessoa>(false, null, "Pessoa não encontrada.");
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
            return new PessoaResponse<Pessoa>(true, null, null);
            
        } catch (Exception e) {
            // Cenário de Erro: Falha no banco de dados
            return new PessoaResponse<Pessoa>(false, null, "Erro ao excluir a pessoa: " + e.getMessage());
        }
    }


}