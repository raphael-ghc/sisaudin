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
@Table(name = "reuniao_busca_conjunta_recomendacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReuniaoRecomendacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reuniao_constatacao_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private ReuniaoConstatacao reuniaoConstatacao;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String dataLimite;
    private String nivelRisco;
    private String gerencia;

    @Column(name = "acao_tomada")
    private String acao; // "Nenhuma ação", "Alterar", "Cancelar", "Aguardar evidências para marcar como Atendida", "Enviar para outra gerência", "Outra Ação"

    @Column(name = "gerencia_encaminhada")
    private String gerenciaEncaminhada; // Utilizado se a ação for "Enviar para outra gerência"

    @Column(columnDefinition = "LONGTEXT")
    private String encaminhamentos;

    @Column(name = "is_nova", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isNova = false;

}
