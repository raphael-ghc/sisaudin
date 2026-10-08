package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.persistence.OrderBy;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "relatorio_final")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class RelatorioFinal extends Documento {

    // false = RAI (Relatório de Auditoria Interna); true = REAI (Relatório Especial de Auditoria Interna)
    @Builder.Default
    private Boolean especial = false;

    @Column(columnDefinition = "LONGTEXT")
    private String introducao;

    @Column(columnDefinition = "LONGTEXT")
    private String consideracoes;

    // Planejamento
    @Column(columnDefinition = "LONGTEXT")
    private String planObjetivo;
    @Column(columnDefinition = "LONGTEXT")
    private String planRiscos;
    @Column(columnDefinition = "LONGTEXT")
    private String planEscopo;
    @Column(columnDefinition = "LONGTEXT")
    private String planLimitacoes;
    @Column(columnDefinition = "LONGTEXT")
    private String planCriterios;
    @Column(columnDefinition = "LONGTEXT")
    private String planProcedimentos;
    @Column(columnDefinition = "LONGTEXT")
    private String planAmostra;

    @Column(columnDefinition = "LONGTEXT")
    private String planTextoInicial;

    @Column(columnDefinition = "LONGTEXT")
    private String preliminaresTextoInicial;

    @Column(columnDefinition = "LONGTEXT")
    private String constatacoesTextoInicial;

    @OneToMany(mappedBy = "relatorioFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    private java.util.List<RelatorioFinalInformacao> preliminares = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "relatorioFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    private java.util.List<RelatorioFinalConstatacao> constatacoes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "relatorioFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<AnexoRelatorioFinal> anexosFinais = new java.util.ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "relatorio_final_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "relatorio_final_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

}
