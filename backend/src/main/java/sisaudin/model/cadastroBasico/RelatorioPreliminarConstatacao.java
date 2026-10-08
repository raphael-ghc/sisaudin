package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

//@Audited
@Entity
@Table(name = "relatorio_constatacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelatorioPreliminarConstatacao {
    private Integer ordem;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatorio_preliminar_id")
    @JsonIgnore
    @ToString.Exclude
    private RelatorioPreliminar relatorioPreliminar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatorio_final_id")
    @JsonIgnore
    @ToString.Exclude
    private RelatorioFinal relatorioFinal;

    private String titulo;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "resumo_fato", columnDefinition = "LONGTEXT")
    private String resumoFato;

    @Column(name = "resumo_criterio", columnDefinition = "LONGTEXT")
    private String resumoCriterio;

    @Column(name = "resumo_causa", columnDefinition = "LONGTEXT")
    private String resumoCausa;

    @Column(name = "resumo_impacto_riscos", columnDefinition = "LONGTEXT")
    @JsonProperty("resumoImpacto")
    @JsonAlias({"resumoImpactoRiscos", "resumo_impacto_riscos", "resumo_impacto", "resumoImpactoRisco"})
    private String resumoImpacto;

    @OneToMany(mappedBy = "constatacao", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RelatorioPreliminarRecomendacao> recomendacoes = new ArrayList<>();

}
