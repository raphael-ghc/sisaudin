package sisaudin.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String remetente;

    public void enviar(String para, String assunto, Map<String, Object> variaveis) throws MessagingException {
        // 1. Preparar o contexto do Thymeleaf com as variáveis dinâmicas
        Context context = new Context();
        context.setVariables(variaveis);

        // 2. Processar o template HTML (procura por 'email-template.html' em src/main/resources/templates)
        String htmlRenderizado = templateEngine.process("email_template_boasVindas", context);

        // 3. Criar a mensagem de e-mail estruturada
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        
        helper.setFrom(remetente);
        helper.setTo(para);
        helper.setSubject(assunto);
        // O segundo parâmetro 'true' indica que o conteúdo enviado é HTML
        helper.setText(htmlRenderizado, true);

        // 4. Enviar o e-mail
        mailSender.send(mimeMessage);
    }
}