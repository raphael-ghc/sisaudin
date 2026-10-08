package sisaudin.model.cadastroBasico;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

//import org.hibernate.envers.Audited;
import org.hibernate.validator.constraints.br.CNPJ;

//@Audited
@Entity
@Table(name = "unidade")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Unidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;
    
    private String status;

    @Column(unique = true, nullable = false)
    private String sigla;
    
    @CNPJ       
    @Column(unique = true, nullable = false)
    private String cnpj;

    /*// Relacionamento: Uma Unidade pode ter várias Pessoas vinculadas (ex: lotação)
    @OneToMany(mappedBy = "unidade")
    private List<Pessoa> membros;*/

    //TODO TRAZER GERENCIAS
    // Relacionamento: Uma Unidade pode ter várias Pessoas vinculadas (ex: lotação)
    @OneToMany(mappedBy = "unidade")
    @JsonIgnore
    private List<Gerencia> gerencias;
}