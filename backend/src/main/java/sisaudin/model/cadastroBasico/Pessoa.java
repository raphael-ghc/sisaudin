package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import sisaudin.model.cadastroBasico.generico.Cargo;

//@Audited
@Entity
@Table(name = "pessoa")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne
    @JoinColumn(name = "cargo_id")
    private Cargo cargo;
    
    private String status;

    @Column(nullable = false)
    @Builder.Default
    private Boolean usuario = false;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String telefone;

    private String foto;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String cartaoPonto;
        

    @ManyToOne
    @JoinColumn(name = "gerencia_id")
    //@JsonIgnore // Oculta a gerencia ao listar a pessoa para evitar o loop
    private Gerencia gerencia; // Lotação da pessoa

    // Mapeamento inverso: não cria coluna na tabela pessoa, apenas lê da tabela gerencia
    @OneToOne(mappedBy = "gerente")
    @JsonIgnore
    private Gerencia gerenciaQueGerencia; 

    // O campo isGerente passa a ser calculado dinamicamente
    @Transient // Não cria coluna no banco
    public Boolean getIsGerente() {
        return this.gerenciaQueGerencia != null;
    }

    public enum Role {
        SISTEMA, GESTOR, AUDITOR, VISITANTE
    }
}