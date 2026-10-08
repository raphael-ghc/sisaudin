package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.persistence.OrderBy;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

//@Audited
@Entity
@Table(name = "nota_final")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class NotaFinal extends Documento {

    @Column(columnDefinition = "LONGTEXT")
    private String introducao;

    @Column(columnDefinition = "LONGTEXT")
    private String consideracoes;

    
    
    
    
    
    
    
    

    

    @Column(columnDefinition = "LONGTEXT")
    private String preliminaresTextoInicial;

    @Column(columnDefinition = "LONGTEXT")
    private String constatacoesTextoInicial;

    @OneToMany(mappedBy = "notaFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    private java.util.List<NotaFinalInformacao> preliminares = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "notaFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    private java.util.List<NotaFinalConstatacao> constatacoes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "notaFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<AnexoNotaFinal> anexosFinais = new java.util.ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "nota_final_gerencia_destinataria",
               joinColumns = @JoinColumn(name = "nota_final_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private java.util.List<Gerencia> gerenciasDestinatarias = new java.util.ArrayList<>();

}
