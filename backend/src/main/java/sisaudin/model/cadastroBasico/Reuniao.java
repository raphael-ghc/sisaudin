package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "reuniao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Reuniao extends Documento {

    private String titulo;

    private String tipoReuniao;

    @Column(columnDefinition = "LONGTEXT")
    private String texto;
}
