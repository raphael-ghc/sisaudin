package sisaudin.model.cadastroBasico.generico;

//import org.hibernate.envers.Audited;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "classe_qualitativa")
//@Audited
public class ClasseQualitativa extends BaseEntity { 
    // Fica totalmente vazia se não tiver campos específicos!
}