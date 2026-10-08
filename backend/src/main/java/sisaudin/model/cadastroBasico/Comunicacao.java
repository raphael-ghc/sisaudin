package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "comunicacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Comunicacao extends Documento {

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "comunicacao_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "comunicacao_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

    private java.time.LocalDate dataEmissao;

    @Column(columnDefinition = "TEXT")
    private String orientacoesGerais;
}
