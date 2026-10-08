package sisaudin.model.cadastroBasico.generico;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "cargo")
public class Cargo extends BaseEntity { 
    // Fica totalmente vazia se não tiver campos específicos!
}