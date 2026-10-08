package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "matriz_achados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class MatrizAchados extends Documento {

    private String nome;

    private String descricao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    private LocalDate dataEmissao;

    private Long planejamentoId;

    private String planejamentoNumeroAno;

    private String planejamentoNome;

    @OneToMany(mappedBy = "matrizAchados", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestaoMatrizAchados> questoes = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "matriz_achados_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "matriz_achados_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private List<Gerencia> gerenciasDestinatarias = new ArrayList<>();
}
