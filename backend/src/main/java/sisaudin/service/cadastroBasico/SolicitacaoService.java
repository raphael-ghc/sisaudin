package sisaudin.service.cadastroBasico;

import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Solicitacao;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.repository.cadastroBasico.SolicitacaoRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SolicitacaoService {

    @Autowired
    private DocumentoNumeroService numeroService;


    public static final String ORIENTACOES_PADRAO = 
            "<p>O presente trabalho de Auditoria Interna visa...</p>" +
            "<p>Solicitamos especial atenção dessa área no sentido de que sejam fornecidas a esta Gerência de Auditoria Interna todas as informações requeridas no prazo acima estabelecido. Caso a temática esteja relacionada à outra área ou não seja aplicável, solicitamos a referida indicação e/ou justificativas. Em caso de impossibilidade de atendimento, ou não se verificando a situação arrolada, essa condição deve ser formalmente registrada com as devidas justificativas neste fluxo de Workflow.</p>";

    public static final String INFORMACOES_PADRAO = 
            "<p>Assim, solicitamos, em consonância com o disposto no artigo 26 da Lei nº 10.180, de 06/02/2001, a disponibilização de documentos, processos e/ou informações e/ou justificativas e/ou esclarecimentos sobre as ações adotadas, conforme formato abaixo estabelecido:</p>";

    @Autowired
    private SolicitacaoRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    public List<Solicitacao> findAll() {
        return repository.findAll();
    }

    public Solicitacao findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação de Auditoria não encontrada com ID: " + id));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Solicitacao createEmpty() {
        Solicitacao sa = new Solicitacao();
        sa.setDataEmissao(LocalDate.now());
        sa.setDataLimiteAtendimento(LocalDate.now().plusDays(15));
        sa.setOrientacoesGerais(ORIENTACOES_PADRAO);
        sa.setInformacoesSolicitadas(INFORMACOES_PADRAO);
        
        Integer anoAtual = LocalDate.now().getYear();
        sa.setAno(anoAtual);
        sa.setNumero(numeroService.getNextAvailableNumber("Solicitacao", anoAtual, null));
        return repository.save(sa);
    }

    public Solicitacao getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<Solicitacao> existing = repository.findAll().stream()
                .filter(s -> s.getItemTrabalho() != null && s.getItemTrabalho().getId().equals(itemTrabalhoId))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        Solicitacao sa = new Solicitacao();
        itemTrabalhoRepository.findById(itemTrabalhoId).ifPresent(sa::setItemTrabalho);
        sa.setDataEmissao(LocalDate.now());
        sa.setDataLimiteAtendimento(LocalDate.now().plusDays(15));
        sa.setOrientacoesGerais(ORIENTACOES_PADRAO);
        sa.setInformacoesSolicitadas(INFORMACOES_PADRAO);

        Integer anoAtual = LocalDate.now().getYear();
        sa.setAno(anoAtual);
        sa.setNumero(numeroService.getNextAvailableNumber("Solicitacao", anoAtual, itemTrabalhoId));
        return repository.save(sa);
    }

    public Solicitacao updateById(Long id, Solicitacao dto, Long itemTrabalhoId) {
        Solicitacao sa = findById(id);

        if (dto.getAno() != null) sa.setAno(dto.getAno());
        if (dto.getNumero() != null) sa.setNumero(dto.getNumero());
        if (dto.getDataInicial() != null) sa.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) sa.setDataFinal(dto.getDataFinal());
        if (dto.getDataEmissao() != null) sa.setDataEmissao(dto.getDataEmissao());
        if (dto.getDataLimiteAtendimento() != null) sa.setDataLimiteAtendimento(dto.getDataLimiteAtendimento());
        if (dto.getEsteTrabalhoVisa() != null) sa.setEsteTrabalhoVisa(dto.getEsteTrabalhoVisa());
        if (dto.getOrientacoesGerais() != null) sa.setOrientacoesGerais(dto.getOrientacoesGerais());
        if (dto.getInformacoesSolicitadas() != null) sa.setInformacoesSolicitadas(dto.getInformacoesSolicitadas());
        if (dto.getSolicitacoes() != null) sa.setSolicitacoes(dto.getSolicitacoes());
        if (dto.getDadosContato() != null) sa.setDadosContato(dto.getDadosContato());
        if (dto.getGerenciasDestinatarias() != null) sa.setGerenciasDestinatarias(dto.getGerenciasDestinatarias());

        if (itemTrabalhoId != null) {
            Optional<ItemTrabalho> item = itemTrabalhoRepository.findById(itemTrabalhoId);
            item.ifPresent(sa::setItemTrabalho);
        } else if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            Optional<ItemTrabalho> item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId());
            item.ifPresent(sa::setItemTrabalho);
        }

        return repository.save(sa);
    }
}
