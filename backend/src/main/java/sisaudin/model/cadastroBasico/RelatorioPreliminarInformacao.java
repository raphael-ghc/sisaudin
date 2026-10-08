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
@Table(name = "relatorio_informacao_preliminar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelatorioPreliminarInformacao {
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

}
