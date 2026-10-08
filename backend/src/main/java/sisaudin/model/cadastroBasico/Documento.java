package sisaudin.model.cadastroBasico;

//import org.hibernate.envers.Audited;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

//@Audited
@MappedSuperclass
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_trabalho_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "ordensServico", "comunicacoes", "notasPreliminar", "notasFinal", "relatoriosPreliminar", "relatoriosFinal", "planosAcaoPreliminar", "planosAcaoFinal", "notasTecnica", "reunioes", "visitas", "equipe", "planejamentos", "matrizesAchados", "reunioesBuscaConjunta", "notasMonitoramento", "solicitacoes", "pareceres"})
    @ToString.Exclude
    private ItemTrabalho itemTrabalho;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("itemTrabalhoId")
    private Long itemTrabalhoId;

    public Long getItemTrabalhoId() {
        if (itemTrabalhoId != null) {
            return itemTrabalhoId;
        }
        return itemTrabalho != null ? itemTrabalho.getId() : null;
    }

    public void setItemTrabalhoId(Long itemTrabalhoId) {
        this.itemTrabalhoId = itemTrabalhoId;
        if (itemTrabalhoId != null && this.itemTrabalho == null) {
            this.itemTrabalho = new ItemTrabalho();
            this.itemTrabalho.setId(itemTrabalhoId);
        }
    }

    private LocalDate dataInicial;
    private LocalDate dataFinal;
    private Integer ano;
    private Integer numero;

    @Builder.Default
    private String status = "Minuta";

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao;

    @PrePersist
    protected void onCreate() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}

