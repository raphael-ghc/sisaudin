package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//@Audited
@Entity
@Table(name = "gerencia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Gerencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    
    
    @Column(unique = true, nullable = false)
    private String nome; 
    
    @Column(unique = true, nullable = false)
    private String sigla; 
    
    private String status;

    @ManyToOne
    @JoinColumn(name = "unidade_id")
    private Unidade unidade;
 
    @OneToOne
    @JoinColumn(name = "gerente_id")
    @JsonIgnore // O Jackson vai ignorar o objeto Pessoa (gerente) completamente na listagem de Gerencia
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Pessoa gerente;

}