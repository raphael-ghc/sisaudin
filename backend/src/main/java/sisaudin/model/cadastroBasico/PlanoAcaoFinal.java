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
@Table(name = "plano_acao_final")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlanoAcaoFinal extends Documento {

    private String nome;

    private String descricao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "plano_acao_final_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "plano_acao_final_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();
}
