package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "reuniao_busca_conjunta_constatacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReuniaoConstatacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reuniao_busca_conjunta_id")
    @JsonIgnore
    @ToString.Exclude
    private ReuniaoBuscaConjunta reuniaoBuscaConjunta;

    private String titulo;

    @Column(name = "resumo_fato", columnDefinition = "LONGTEXT")
    private String resumoFato;

    @Column(name = "resumo_criterio", columnDefinition = "LONGTEXT")
    private String resumoCriterio;

    @Column(name = "resumo_causa", columnDefinition = "LONGTEXT")
    private String resumoCausa;

    @Column(name = "resumo_impacto_riscos", columnDefinition = "LONGTEXT")
    private String resumoImpacto;

    @OneToMany(mappedBy = "reuniaoConstatacao", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReuniaoRecomendacao> recomendacoes = new ArrayList<>();

}
