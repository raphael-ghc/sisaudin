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
@Table(name = "historico_status_documento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricoStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long documentoId;

    private String documentoTipo;

    private String statusAnterior;

    private String statusNovo;

    private LocalDateTime dataHora;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private Pessoa usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destinatario_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private Pessoa usuarioDestinatario;

    @Column(columnDefinition = "LONGTEXT")
    private String justificativaExcecao;

    @Column(columnDefinition = "LONGTEXT")
    private String observacoes;
}
