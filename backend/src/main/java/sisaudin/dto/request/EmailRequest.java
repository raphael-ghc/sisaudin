package sisaudin.dto.request;

public class EmailRequest {
    private String para;
    private String assunto;
    private String texto;

    // Getters e Setters
    public String getPara() { return para; }
    public void setPara(String para) { this.para = para; }
    public String getAssunto() { return assunto; }
    public void setAssunto(String assunto) { this.assunto = assunto; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
}