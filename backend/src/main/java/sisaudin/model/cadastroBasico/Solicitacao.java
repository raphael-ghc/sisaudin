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
@Table(name = "solicitacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Solicitacao extends Documento {

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "solicitacao_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "solicitacao_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

    private java.time.LocalDate dataEmissao;

    private java.time.LocalDate dataLimiteAtendimento;

    @Column(columnDefinition = "LONGTEXT")
    private String esteTrabalhoVisa;

    @Column(columnDefinition = "TEXT")
    private String orientacoesGerais;

    @Column(columnDefinition = "TEXT")
    private String informacoesSolicitadas;

    @Column(columnDefinition = "LONGTEXT")
    private String solicitacoes;

    @Column(columnDefinition = "LONGTEXT")
    private String dadosContato;
}
