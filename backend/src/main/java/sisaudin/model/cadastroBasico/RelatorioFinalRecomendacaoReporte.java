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
@Table(name = "relatorio_reporte_recomendacao_final")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelatorioFinalRecomendacaoReporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recomendacao_final_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private RelatorioFinalRecomendacao recomendacao;

    private String tipo; // "auditada" ou "auditoria"

    private String dataHora;
    private String gerencia;
    private String responsavel;

    @Column(columnDefinition = "LONGTEXT")
    private String content;
}
