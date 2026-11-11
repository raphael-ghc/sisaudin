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
import sisaudin.model.cadastroBasico.generico.TecnicaAuditoria;
import sisaudin.model.cadastroBasico.generico.TipoRisco;

//@Audited
@Entity
@Table(name = "planejamento_questao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestaoPlanejamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planejamento_id")
    @JsonIgnore
    @ToString.Exclude
    private Planejamento planejamento;

    // "questao" e "conteudo" guardam o mesmo texto (a tela grava os dois).
    @Column(columnDefinition = "LONGTEXT")
    private String questao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    // "criterio" e "criterios" guardam o mesmo texto (a tela grava os dois).
    @Column(columnDefinition = "LONGTEXT")
    private String criterio;

    @Column(columnDefinition = "LONGTEXT")
    private String criterios;

    // Gerências destinatárias da questão (uma ou mais, do cadastro).
    // As colunas antigas de texto (gerencia, gerencia_destinataria, tecnicas, riscos) continuam no banco,
    // sem uso; a PlanejamentoMatrizMigration converteu o conteúdo delas para as tabelas abaixo.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "planejamento_questao_gerencia",
               joinColumns = @JoinColumn(name = "questao_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @OrderColumn(name = "ordem")
    @Builder.Default
    private List<Gerencia> gerencias = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "planejamento_questao_tecnica",
               joinColumns = @JoinColumn(name = "questao_id"),
               inverseJoinColumns = @JoinColumn(name = "tecnica_id"))
    @OrderColumn(name = "ordem")
    @Builder.Default
    private List<TecnicaAuditoria> tecnicas = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "planejamento_questao_tipo_risco",
               joinColumns = @JoinColumn(name = "questao_id"),
               inverseJoinColumns = @JoinColumn(name = "tipo_risco_id"))
    @OrderColumn(name = "ordem")
    @Builder.Default
    private List<TipoRisco> riscos = new ArrayList<>();

    // Posição da questão no Planejamento (1, 2, 3...). Definida pelo serviço ao salvar.
    private Integer ordem;

    @Column(columnDefinition = "LONGTEXT")
    private String fato;

    @Column(columnDefinition = "LONGTEXT")
    private String anexo;
}
