package sisaudin.model.cadastroBasico;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sisaudin.model.cadastroBasico.Pessoa;

import java.time.LocalDateTime;

@Entity
@Table(name = "justificativa_fluxo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JustificativaFluxo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_trabalho_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ItemTrabalho itemTrabalho;

    private LocalDateTime dataHora;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private Pessoa usuario;

    private String gerencias; // Nomes ou IDs das gerências selecionadas no modal B1

    private String documentoSolicitado; // ex: Solicitação de Auditoria, Nota de Auditoria Preliminar, etc.

    private String causa; // ex: "não criação de Comunicação de Auditoria antes de criar o documento solicitado"

    @Column(columnDefinition = "LONGTEXT")
    private String justificativa;
}
