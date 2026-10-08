package sisaudin.model.cadastroBasico;

import java.time.LocalDate;

//import org.hibernate.envers.Audited;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//@Audited
@Entity
@Table(name = "gerencia_historico")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class GerenciaHistorico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gerencia_id")
    private Gerencia gerencia;

    @ManyToOne
    @JoinColumn(name = "pessoa_id")
    private Pessoa gerente;

    private LocalDate dataInicio;
    private LocalDate dataFim; // Se for nulo, é o gerente atual

    private String portariaNomeacao; // Útil em órgãos públicos
}