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
@Table(name = "reuniao_busca_conjunta")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReuniaoBuscaConjunta extends Documento {

    private String nome;

    private String descricao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    @OneToMany(mappedBy = "reuniaoBuscaConjunta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ReuniaoConstatacao> constatacoes = new java.util.ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "reuniao_busca_conjunta_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "reuniao_busca_conjunta_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "reuniaoBuscaConjunta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ReuniaoBuscaConjuntaAgendamento> agendamentos = new java.util.ArrayList<>();
}
