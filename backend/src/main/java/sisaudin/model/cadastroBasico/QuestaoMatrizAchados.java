package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Questão da Matriz de Achados. Gerências, conteúdo, critérios, técnicas e riscos vêm da questão do
 * Planejamento ligada (questaoPlanejamento) e não são editados aqui; a Matriz só recebe fatos e evidências.
 *
 * Os campos de texto (questao, conteudo, gerencia...) são da versão anterior, em que a Matriz copiava a questão.
 * Só são mostrados nas questões antigas que a migração não conseguiu ligar a uma questão do Planejamento.
 */
//@Audited
@Entity
@Table(name = "matriz_achados_questao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestaoMatrizAchados {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matriz_achados_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private MatrizAchados matrizAchados;

    // ON DELETE SET NULL: ao excluir o item de trabalho (que apaga Planejamento e Matriz em cascata),
    // a ordem das exclusões não importa. A exclusão de questão com fatos é barrada antes, no serviço.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "questao_planejamento_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QuestaoPlanejamento questaoPlanejamento;

    @OneToMany(mappedBy = "questao", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC, id ASC")
    @Builder.Default
    private List<FatoMatrizAchados> fatos = new ArrayList<>();

    private Integer ordem;

    // --- Campos da versão anterior (somente leitura; ver comentário da classe) ---

    @Column(columnDefinition = "LONGTEXT")
    private String questao;

    @Column(columnDefinition = "LONGTEXT")
    private String conteudo;

    private String gerencia;

    @Column(columnDefinition = "LONGTEXT")
    private String gerenciaDestinataria;

    @Column(columnDefinition = "LONGTEXT")
    private String criterio;

    @Column(columnDefinition = "LONGTEXT")
    private String criterios;

    @Column(columnDefinition = "LONGTEXT")
    private String tecnicas;

    @Column(columnDefinition = "LONGTEXT")
    private String riscos;

    // Fato e evidência únicos da versão anterior; a migração os copiou para "fatos".
    @Column(columnDefinition = "LONGTEXT")
    @JsonIgnore
    private String fatoEncontrado;

    @Column(columnDefinition = "LONGTEXT")
    @JsonIgnore
    private String evidencia;
}
