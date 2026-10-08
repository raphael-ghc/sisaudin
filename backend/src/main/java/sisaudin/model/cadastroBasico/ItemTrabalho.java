package sisaudin.model.cadastroBasico;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

//import org.hibernate.envers.Audited;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Transient;
import sisaudin.dto.DocumentoCriadoDTO;
import sisaudin.service.cadastroBasico.FluxoDocumentoService;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.CascadeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sisaudin.model.cadastroBasico.generico.Macroprocesso;
import sisaudin.model.cadastroBasico.generico.NivelRisco;
import sisaudin.model.cadastroBasico.generico.Origem;
import sisaudin.model.cadastroBasico.generico.TipoItem;
import sisaudin.model.cadastroBasico.generico.TipoServico;

//@Audited
@Entity
@Table(name = "item_trabalho")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class ItemTrabalho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    
    
    @Column(unique = true, nullable = false)
    private String nome; 
    
    @Column(unique = true, nullable = false)
    private String sigla; 
    
    private String status;
    
    private String anoReferencia;
    private String numeroReferencia;

    @Column(columnDefinition = "TEXT")
    private String objetoAuditado;
    
    @Column(columnDefinition = "TEXT")
    private String objetivoAuditoria;

    private LocalDateTime dataInicialPrevista;
    private LocalDateTime dataFinalPrevista;

    private Integer horasPrevistas;

    @ManyToOne
    @JoinColumn(name = "tipo_item_id")
    private TipoItem tipoItem;

    @ManyToOne
    @JoinColumn(name = "tipo_servico_id")
    private TipoServico tipoServico;

    @ManyToOne
    @JoinColumn(name = "macroprocesso_id")
    private Macroprocesso macroprocesso;

    @ManyToOne
    @JoinColumn(name = "origem_id")
    private Origem origem;
    
    @ManyToOne
    @JoinColumn(name = "nivel_risco_id")
    private NivelRisco nivelRisco;
 
    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    private Pessoa responsavel;

    @ManyToOne
    @JoinColumn(name = "supervisor_id")
    private Pessoa supervisor;

    @ManyToOne
    @JoinColumn(name = "supervisor_tecnico_id")
    private Pessoa supervisorTecnico;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "item_trabalho_equipe",
               joinColumns = @JoinColumn(name = "item_trabalho_id"),
               inverseJoinColumns = @JoinColumn(name = "pessoa_id"))
    @Builder.Default
    private List<Pessoa> equipe = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<OrdemServico> ordensServico = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Comunicacao> comunicacoes = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<NotaPreliminar> notasPreliminar = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<NotaFinal> notasFinal = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<RelatorioPreliminar> relatoriosPreliminar = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<RelatorioFinal> relatoriosFinal = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<PlanoAcaoPreliminar> planosAcaoPreliminar = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<PlanoAcaoFinal> planosAcaoFinal = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<NotaTecnica> notasTecnica = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Reuniao> reunioes = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Visita> visitas = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "item_trabalho_gerencia",
               joinColumns = @JoinColumn(name = "item_trabalho_id"),
               inverseJoinColumns = @JoinColumn(name = "gerencia_id"))
    @Builder.Default
    private List<Gerencia> gerencias = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Solicitacao> solicitacoes = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Parecer> pareceres = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Planejamento> planejamentos = new ArrayList<>();
    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<MatrizAchados> matrizesAchados = new ArrayList<>();

    @OneToMany(mappedBy = "itemTrabalho", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReuniaoBuscaConjunta> reunioesBuscaConjunta = new ArrayList<>();

    @Transient
    @JsonProperty("faseAuditoria")
    public String getFaseAuditoria() {        
        if ((relatoriosPreliminar != null && !relatoriosPreliminar.isEmpty()) ||
            (relatoriosFinal != null && !relatoriosFinal.isEmpty()) ||
            (notasPreliminar != null && !notasPreliminar.isEmpty()) ||
            (notasFinal != null && !notasFinal.isEmpty()) ||
            (notasTecnica != null && !notasTecnica.isEmpty()) ||
            (pareceres != null && !pareceres.isEmpty()) ||
            (planosAcaoPreliminar != null && !planosAcaoPreliminar.isEmpty()) ||
            (planosAcaoFinal != null && !planosAcaoFinal.isEmpty()) ||
            (reunioesBuscaConjunta != null && !reunioesBuscaConjunta.isEmpty())) {
            return "RELATÓRIO";
        }
        if (matrizesAchados != null && !matrizesAchados.isEmpty()) {
            return "EXECUÇÃO";
        }
        return "PLANEJAMENTO";
    }

    private boolean temStatusAprovado(List<? extends Documento> docs) {
        if (docs == null) return false;
        return docs.stream().anyMatch(d -> d.getStatus() != null && d.getStatus().equalsIgnoreCase("Aprovado"));
    }

    @Transient
    @JsonProperty("documentosCriados")
    public List<DocumentoCriadoDTO> getDocumentosCriados() {
        return FluxoDocumentoService.extrairDocumentosCriados(this);
    }
}