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
@Table(name = "parecer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Parecer extends Documento {

    @Column(columnDefinition = "LONGTEXT")
    private String introducao;
    @Column(columnDefinition = "LONGTEXT")
    private String objetivo;

    @Column(columnDefinition = "LONGTEXT")
    private String escopoAvaliacao;
    
    @Column(columnDefinition = "LONGTEXT")
    private String analiseFatos;


    @Column(columnDefinition = "LONGTEXT")
    private String consideracoes;
    @OneToMany(mappedBy = "parecer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<AnexoRelatorio> anexosFinais = new java.util.ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "parecer_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "parecer_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

}
