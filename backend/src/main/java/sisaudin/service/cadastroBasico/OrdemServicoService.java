package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.annotation.JsonTypeInfo.As;
//import com.microsoft.playwright.impl.SerializedValue.O;

import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.OrdemServico;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.OrdemServicoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrdemServicoService {

    /*public static final String ORIENTACOES_PADRAO = 
            "<p>1. Qualquer prejuízo à independência e à objetividade deverá ser imediatamente informado à Gerência da AUDIN;</p>" +
            "<p>2. Caso haja alguma contingência, a Gerência da AUDIN deverá ser informada, com antecedência, para avaliar possibilidades, tais como alteração de escopo ou prorrogação do prazo;</p>" +
            "<p>3. O planejamento deverá ser documentado em papéis de trabalho;</p>" +
            "<p>4. Todos os fatos relatados devem ser evidenciados em papéis de trabalho;</p>" +
            "<p>5. As recomendações devem estar focadas nas causas e consequências factuais dos riscos trabalhados;</p>" +
            "<p>6. Os papéis de trabalho devem ser organizados e devidamente arquivados; e</p>" +
            "<p>7. Este trabalho será supervisionado durante todas as suas fases.";*/

    public static final String ORIENTACOES_PADRAO = 
            "<ul>" +
                "<li><b>1.</b><span> Qualquer prejuízo à independência e à objetividade deverá ser imediatamente informado à Gerência da AUDIN;</span></li>" +
                "<li><b>2.</b> Caso haja alguma contingência, a Gerência da AUDIN deverá ser informada, com antecedência, para avaliar possibilidades, tais como alteração de escopo ou prorrogação do prazo;</li>" +		
                "<li><b>3.</b> O planejamento deverá ser documentado em papéis de trabalho;</li>" +		
                "<li><b>4.</b> Todos os fatos relatados devem ser evidenciados em papéis de trabalho;</li>" +		
                "<li><b>5.</b> As recomendações devem estar focadas nas causas e consequências factuais dos riscos trabalhados;</li>" +		
                "<li><b>6.</b> Os papéis de trabalho devem ser organizados e devidamente arquivados e</li>" +		
                "<li><b>7.</b> Este trabalho será supervisionado durante todas as suas fases.</li>"+
            "</ul>";



    @Autowired
    private OrdemServicoRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private DocumentoNumeroService numeroService;

    public List<OrdemServico> findAll() {
        return repository.findAll();
    }

    public OrdemServico findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ordem de Serviço não encontrada com ID: " + id));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public OrdemServico createEmpty() {
        OrdemServico os = new OrdemServico();
        os.setDataEmissao(LocalDate.now());
        os.setOrientacoesGerais(ORIENTACOES_PADRAO);
        
        Integer anoAtual = LocalDate.now().getYear();
        os.setAno(anoAtual);
        os.setNumero(numeroService.getNextAvailableNumber("OrdemServico", anoAtual, null));
        
        return repository.save(os);
    }

    public OrdemServico getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<OrdemServico> existing = repository.findAll().stream()
                .filter(o -> o.getItemTrabalho() != null && o.getItemTrabalho().getId().equals(itemTrabalhoId))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        OrdemServico os = new OrdemServico();
        os.setItemTrabalho(itemTrabalho);
        os.setDataEmissao(LocalDate.now());
        os.setOrientacoesGerais(ORIENTACOES_PADRAO);
        
        Integer anoAtual = LocalDate.now().getYear();
        os.setAno(anoAtual);
        os.setNumero(numeroService.getNextAvailableNumber("OrdemServico", anoAtual, itemTrabalhoId));
        
        return repository.save(os);
    }

    public OrdemServico updateById(Long id, OrdemServico dto, Long itemTrabalhoId) {
        OrdemServico os = findById(id);

        if (itemTrabalhoId != null) {
            ItemTrabalho it = itemTrabalhoRepository.findById(itemTrabalhoId)
                    .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));
            os.setItemTrabalho(it);
        }

        if (dto.getAno() != null) os.setAno(dto.getAno());
        if (dto.getNumero() != null) os.setNumero(dto.getNumero());
        if (dto.getDataInicial() != null) os.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) os.setDataFinal(dto.getDataFinal());
        if (dto.getDataEmissao() != null) os.setDataEmissao(dto.getDataEmissao());
        if (dto.getOrientacoesGerais() != null) os.setOrientacoesGerais(dto.getOrientacoesGerais());

        return repository.save(os);
    }
}
