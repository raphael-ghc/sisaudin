package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "planejamento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Planejamento extends Documento {

    private LocalDate dataEmissao;

    private String tipoAuditoria;

    @Column(columnDefinition = "LONGTEXT")
    private String escopo;

    @Column(columnDefinition = "LONGTEXT")
    private String descricaoObjetoAuditado;

    @Column(columnDefinition = "LONGTEXT")
    private String principaisRiscos;

    @Column(columnDefinition = "LONGTEXT")
    private String medidasControle;

    @Column(columnDefinition = "LONGTEXT")
    private String materialidadeRecursos;

    @Column(columnDefinition = "LONGTEXT")
    private String pontosCriticosControle;

    @Column(columnDefinition = "LONGTEXT")
    private String indicadoresDesempenho;

    @Column(columnDefinition = "LONGTEXT")
    private String responsaveisObjeto;

    @Column(columnDefinition = "LONGTEXT")
    private String sistemasInformatizados;

    @Column(columnDefinition = "LONGTEXT")
    private String descricaoGerenciasAuditadas;

    @Column(columnDefinition = "LONGTEXT")
    private String trabalhosAnterioresAuditoriaInterna;

    @Column(columnDefinition = "LONGTEXT")
    private String trabalhosAnterioresTcu;

    @Column(columnDefinition = "LONGTEXT")
    private String trabalhosAnterioresCgu;

    private LocalDate dataInicialAmostra;

    private LocalDate dataFinalAmostra;

    @Column(columnDefinition = "LONGTEXT")
    private String criterioUniversoAmostral;

    @Column(columnDefinition = "LONGTEXT")
    private String universo;

    @Column(columnDefinition = "LONGTEXT")
    private String amostra;

    @Column(columnDefinition = "LONGTEXT")
    private String porcentagemRepresentatividade;

    @Column(columnDefinition = "LONGTEXT")
    private String orcamentoEstimado;

    private LocalDate dataInicialPlanejamento;

    private LocalDate dataFinalPlanejamento;

    private LocalDate dataInicialExecucao;

    private LocalDate dataFinalExecucao;

    private LocalDate dataInicialRelatorio;

    private LocalDate dataFinalRelatorio;

    private String nome;

    private String descricao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    @OneToMany(mappedBy = "planejamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestaoPlanejamento> questoes = new ArrayList<>();

    // Gerências destinatárias escolhidas na tela (nomes, como o seletor as mostra)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "planejamento_gerencia_destinataria",
                     joinColumns = @JoinColumn(name = "planejamento_id"))
    @OrderColumn(name = "ordem")
    @Column(name = "gerencia")
    @Builder.Default
    private List<String> gerenciasDestinatarias = new ArrayList<>();
}
