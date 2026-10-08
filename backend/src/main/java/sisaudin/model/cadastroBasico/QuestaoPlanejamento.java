package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

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

    @Column(columnDefinition = "LONGTEXT")
    private String questao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    private String gerencia;

    @Column(columnDefinition = "LONGTEXT")
    private String gerenciaDestinataria;

    @Column(columnDefinition = "LONGTEXT")
    private String criterio;

    @Column(columnDefinition = "LONGTEXT")
    private String criterios;

    @Column(columnDefinition = "LONGTEXT")
    private String tecnicas;

    @Column(columnDefinition = "LONGTEXT")
    private String riscos;

    @Column(columnDefinition = "LONGTEXT")
    private String fato;

    @Column(columnDefinition = "LONGTEXT")
    private String anexo;
}
