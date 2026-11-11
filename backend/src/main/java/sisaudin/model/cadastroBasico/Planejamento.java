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
import sisaudin.model.cadastroBasico.generico.TipoAuditoria;

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

    // Tipos de auditoria do Planejamento (um ou mais, do cadastro tipo_auditoria: Desempenho, Financeira, Conformidade...).
    // O Serviço de Auditoria (Avaliação, Consultoria...) não fica aqui: é o tipo de serviço do item de trabalho.
    // A coluna antiga de texto planejamento.tipo_auditoria fica no banco sem uso; a PlanejamentoMatrizMigration
    // converteu o conteúdo dela (etapa 2026-11-planejamento-tipo-auditoria).
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "planejamento_tipo_auditoria",
               joinColumns = @JoinColumn(name = "planejamento_id"),
               inverseJoinColumns = @JoinColumn(name = "tipo_auditoria_id"))
    @OrderColumn(name = "ordem")
    @Builder.Default
    private List<TipoAuditoria> tiposAuditoria = new ArrayList<>();

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
    @OrderBy("ordem ASC, id ASC")
    @Builder.Default
    private List<QuestaoPlanejamento> questoes = new ArrayList<>();

    // Gerências destinatárias do documento, ligadas ao cadastro de gerências.
    // Até 2026.10 eram gravadas como nomes na tabela planejamento_gerencia_destinataria, que fica no banco
    // sem uso; a PlanejamentoMatrizMigration converteu os nomes para esta tabela.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "planejamento_gerencia",
               joinColumns = @JoinColumn(name = "planejamento_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @OrderColumn(name = "ordem")
    @Builder.Default
    private List<Gerencia> gerenciasDestinatarias = new ArrayList<>();
}
