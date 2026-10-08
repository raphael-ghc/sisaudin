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
@Table(name = "relatorio_anexo_final")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnexoRelatorio {

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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_preliminar_id")
    @JsonIgnore
    @ToString.Exclude
    private NotaPreliminar notaPreliminar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_tecnica_id")
    @JsonIgnore
    @ToString.Exclude
    private NotaTecnica notaTecnica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parecer_id")
    @JsonIgnore
    @ToString.Exclude
    private Parecer parecer;


    private String titulo;

    private String tipo;

    private String orientacao;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private Integer ordem;
}
