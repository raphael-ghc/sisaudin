package sisaudin.model.cadastroBasico;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reuniao_busca_conjunta_agendamento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReuniaoBuscaConjuntaAgendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reuniao_busca_conjunta_id")
    @JsonIgnore
    @ToString.Exclude
    private ReuniaoBuscaConjunta reuniaoBuscaConjunta;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    private String local;

    @Column(columnDefinition = "LONGTEXT")
    private String pessoas;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "reuniao_agendamento_gerencia",
               joinColumns = @JoinColumn(name = "agendamento_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private List<Gerencia> gerencias = new ArrayList<>();
}
