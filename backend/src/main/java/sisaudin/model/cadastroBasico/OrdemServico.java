package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "ordem_servico")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class OrdemServico extends Documento {

    private LocalDate dataEmissao;

    @Column(columnDefinition = "LONGTEXT")
    private String orientacoesGerais;
}
