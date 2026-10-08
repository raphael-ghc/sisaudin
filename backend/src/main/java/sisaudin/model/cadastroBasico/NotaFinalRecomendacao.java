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
@Table(name = "nota_final_recomendacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaFinalRecomendacao {
    private Integer ordem;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "constatacao_final_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private NotaFinalConstatacao constatacao;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String dataLimite;
    private String nivelRisco;
    private String gerencia;
    private String tipoBeneficio;

    @Column(columnDefinition = "LONGTEXT")
    private String detalheBeneficio;

    private String statusBeneficio; // "Esperado" ou "Realizado"
    
    private String anoImplementacao;

    @Column(columnDefinition = "LONGTEXT")
    private String descricaoBeneficioRealizado;

    @Column(columnDefinition = "LONGTEXT")
    private String descricaoCustoBeneficio;

    private Double valorCustoBeneficio;
    private Double valorBrutoBeneficio;
    private Double valorLiquidoBeneficio;

    @OneToMany(mappedBy = "recomendacao", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<NotaFinalRecomendacaoReporte> reportes = new ArrayList<>();
}
