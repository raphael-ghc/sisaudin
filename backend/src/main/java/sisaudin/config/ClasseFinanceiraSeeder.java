package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import sisaudin.model.cadastroBasico.generico.ClasseFinanceira;
import sisaudin.repository.cadastroBasico.generico.ClasseFinanceiraRepository;

import java.util.Arrays;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
public class ClasseFinanceiraSeeder implements CommandLineRunner {

    @Autowired
    private ClasseFinanceiraRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return; // Already seeded
        }

        List<String> inativos = Arrays.asList(
            "(INATIVADO)Cancelamento de benefício social.",
            "(INATIVADO)Cancelamento de convênio ou contrato de repasse com objeto desnecessário, sem instrução legal ou inadequado tecnicamente.",
            "(INATIVADO)Recuperação de valores decorrentes de acordos de leniência.",
            "(INATIVADO)Recuperação de valores decorrentes de processos correcionais com TCE, decorrente de ação de controle da CGU.",
            "(INATIVADO)Recuperação de valores decorrentes de processos correcionais.",
            "(INATIVADO)Recuperação de valores decorrentes de processos disciplinares com TCE.",
            "(INATIVADO)Recuperação de valores pagos indevidamente a partir de ações de controle relacionadas a contratos.",
            "(INATIVADO)Recuperação de valores pagos indevidamente a partir de ações de controle relacionadas a convênios ou contratos de repasse.",
            "(INATIVADO)Recuperação de valores pagos indevidamente a partir de ações de controle relacionadas à gestão de pessoas.",
            "(INATIVADO)Redução nos valores de convênios ou contratos de repasse, mantendo quantidade e qualidade necessárias de bens e serviços."
        );

        List<String> ativos = Arrays.asList(
            "Arrecadação de multa legal ou prevista em contrato.",
            "Cancelamento de licitação/contrato com objeto desnecessário, inconsistente ou inadequado tecnicamente.",
            "Compatibilização do objeto contratado com as especificações ou com o projeto.",
            "Eliminação de desperdícios ou redução de custos administrativos.",
            "Incremento da eficiência, eficácia ou efetividade de programa de governo ou da gestão pública.",
            "Incremento da receita prevista.",
            "Recuperação de valores pagos indevidamente a partir de ações de controle em geral.",
            "Recuperação do custo de operações de crédito subsidiado.",
            "Redução nos valores contratados, mantendo quantidade e qualidade necessárias de bens e serviços.",
            "Redução nos valores licitados, mantendo quantidade e qualidade necessárias de bens e serviços.",
            "Suspensão de pagamento continuado indevido.",
            "Suspensão de pagamento não continuado não aderente aos princípios da legalidade ou economicidade."
        );

        for (String nome : inativos) {
            ClasseFinanceira cf = new ClasseFinanceira();
            cf.setNome(nome);
            cf.setDescricao(nome); // Repeats the name in the description
            cf.setStatus("desabilitado");
            repository.save(cf);
        }

        for (String nome : ativos) {
            ClasseFinanceira cf = new ClasseFinanceira();
            cf.setNome(nome);
            cf.setDescricao(nome); // Repeats the name in the description
            cf.setStatus("ACTIVE");
            repository.save(cf);
        }
        
        System.out.println("SEEDER: Classes Financeiras inseridas com sucesso.");
    }
}
