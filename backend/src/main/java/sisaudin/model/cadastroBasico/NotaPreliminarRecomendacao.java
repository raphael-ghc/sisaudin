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
@Table(name = "nota_preliminar_recomendacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaPreliminarRecomendacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_preliminar_constatacao_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private NotaPreliminarConstatacao constatacao;

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

}
