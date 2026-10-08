package sisaudin.listeners;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import sisaudin.events.UserRegistradoEvent;
import sisaudin.service.EmailService;

import jakarta.mail.MessagingException;

@Component
public class EmailNotificationListener {

    private final EmailService emailService;

    public EmailNotificationListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @Value("${sisaudin.link}")
    private String sisaudinLink;

    @Async
    @EventListener
    public void handleUserRegistradoEvent(UserRegistradoEvent event) throws MessagingException {

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("linkSistema", sisaudinLink);
        variaveis.put("userName", event.getUserName());

        emailService.enviar(event.getEmail(), "SisAudin - Boas Vindas", variaveis);
    }

    /*@Async
    @EventListener
    public void handleRedefinirSenhaEvent(PasswordResetTokenEvent event) throws MessagingException {

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("linkSistema", sisaudinLink);
        variaveis.put("conteudo", "Para redefinir a sua senha, clique no link a seguir:\n" + event.getUrl());
        variaveis.put("linkRedefinirSenha", "Para redefinir a sua senha, clique no link a seguir:\n" + event.getUrl());         

        emailService.enviar(event.getEmail(), "SisAudin - Recuperação de Senha", variaveis);
    }*/




}