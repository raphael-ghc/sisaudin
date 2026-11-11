package sisaudin.model.cadastroBasico;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Um fato encontrado e sua evidência, dentro de uma questão da Matriz de Achados.
 * Cada questão pode ter vários; no documento, cada um ocupa uma linha.
 * Os anexos de cada fato ficam nas seções "Fato Matriz {id}" e "Evidência Matriz {id}".
 */
@Entity
@Table(name = "matriz_achados_fato")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FatoMatrizAchados {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questao_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QuestaoMatrizAchados questao;

    private Integer ordem;

    @Column(columnDefinition = "LONGTEXT")
    private String fato;

    @Column(columnDefinition = "LONGTEXT")
    private String evidencia;
}
