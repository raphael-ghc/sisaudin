package sisaudin.service.cadastroBasico;

import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Comunicacao;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.repository.cadastroBasico.ComunicacaoRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ComunicacaoService {

    @Autowired
    private DocumentoNumeroService numeroService;


    public static final String ORIENTACOES_PADRAO = 
        "<p>Em conformidade com o disposto na Instrução Normativa CGU/SFC nº 03/2017, informamos que daremos início aos trabalhos de auditoria, conforme discriminado acima.</p>" + 
        "<p>Os trabalhos serão realizados compreendendo, no primeiro momento, a fase de planejamento dos trabalhos e, na sequência, a execução dos procedimentos de auditoria. Após, será encaminhado Relatório Preliminar de Auditoria ou Solicitação de Auditoria e Constatações (SAC), para apresentação de esclarecimentos adicionais e que servirá de subsídio para a realização de Reuniã o de Busca Conjunta de Soluções (RBCS) que discutirá os achados (quando houver), e posterior emissão do Relatório Final de Auditoria.</p>"+
        "<p>Para o bom desenvolvimento dos trabalhos, solicitamos a designação de empregado para realizar a interlocução entre a equipe de auditoria e as unidades auditadas, de forma a viabilizar a tempestiva apresentação de documentos, manifestações, acessos e/ou esclarecimentos necessários à condução da auditoria, bem como atendimento às Solicitações de Auditoria Interna (SAIs).</p>" + 
        "<p>A equipe, o Supervisor e a coordenação dos trabalhos serão compostas pelos empregados citados acima. Solicitamos especial atenção da(s) área(s), no sentido de que sejam fornecidos, aos referidos empregados, todos os documentos e informações solicitados, observando-se os prazos estabelecidos, em atenção ao artigo 26 da Lei n° 10.180/2001 e ao item 144 do Anexo da Instrução Normativa CGU/SFC n.º 03/2017.</p>" + 
        "<p>Estamos à disposição para eventuais esclarecimentos.</p>" + 
        "<p>Atenciosamente,</p>";

    @Autowired
    private ComunicacaoRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    public List<Comunicacao> findAll() {
        return repository.findAll();
    }

    public Comunicacao findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comunicação de Auditoria não encontrada com ID: " + id));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Comunicacao createEmpty() {
        Comunicacao ca = new Comunicacao();
        ca.setDataEmissao(LocalDate.now());
        ca.setOrientacoesGerais(ORIENTACOES_PADRAO);
        
        Integer anoAtual = LocalDate.now().getYear();
        ca.setAno(anoAtual);
        ca.setNumero(numeroService.getNextAvailableNumber("Comunicacao", anoAtual, null));
        return repository.save(ca);
    }

    public Comunicacao getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<Comunicacao> existing = repository.findAll().stream()
                .filter(c -> c.getItemTrabalho() != null && c.getItemTrabalho().getId().equals(itemTrabalhoId))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        Comunicacao ca = new Comunicacao();
        itemTrabalhoRepository.findById(itemTrabalhoId).ifPresent(ca::setItemTrabalho);
        ca.setDataEmissao(LocalDate.now());
        ca.setOrientacoesGerais(ORIENTACOES_PADRAO);

        Integer anoAtual = LocalDate.now().getYear();
        ca.setAno(anoAtual);
        ca.setNumero(numeroService.getNextAvailableNumber("Comunicacao", anoAtual, itemTrabalhoId));
        return repository.save(ca);
    }

    public Comunicacao updateById(Long id, Comunicacao dto, Long itemTrabalhoId) {
        Comunicacao ca = findById(id);

        if (dto.getAno() != null) ca.setAno(dto.getAno());
        if (dto.getNumero() != null) ca.setNumero(dto.getNumero());
        if (dto.getDataInicial() != null) ca.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) ca.setDataFinal(dto.getDataFinal());
        if (dto.getDataEmissao() != null) ca.setDataEmissao(dto.getDataEmissao());
        if (dto.getOrientacoesGerais() != null) ca.setOrientacoesGerais(dto.getOrientacoesGerais());
        if (dto.getGerenciasDestinatarias() != null) ca.setGerenciasDestinatarias(dto.getGerenciasDestinatarias());

        if (itemTrabalhoId != null) {
            Optional<ItemTrabalho> item = itemTrabalhoRepository.findById(itemTrabalhoId);
            item.ifPresent(ca::setItemTrabalho);
        } else if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            Optional<ItemTrabalho> item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId());
            item.ifPresent(ca::setItemTrabalho);
        }

        return repository.save(ca);
    }
}
