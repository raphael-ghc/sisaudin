package sisaudin.service;

import com.microsoft.playwright.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PdfGeneratorService {

    public byte[] gerarPdfComSumario(String htmlContent, String docName, String docVersion) throws IOException {
        // 1. FASE DE PREPARAÇÃO: Injetar marcadores no HTML usando Jsoup
        Document doc = Jsoup.parse(htmlContent);
        
        // --- INJEÇÃO DE ESTILOS OBRIGATÓRIOS PARA O PDF ---
        String css = "<style>" +
            "body, p, div, td, th, span, li, blockquote, .editor-content { font-family: 'Calibri', sans-serif !important; font-size: 18pt !important; }" +
            ".img-caption, .img-caption *, .img-source, .img-date { font-family: 'Calibri', sans-serif !important; font-size: 10pt !important; color: black !important; text-align: center !important; }" +
            ".img-title, .img-title * { font-family: 'Calibri', sans-serif !important; font-size: 18pt !important; font-weight: bold !important; text-align: center !important; }" +
            "</style>";
        doc.head().append(css);
        
        // --- PREPARAÇÃO DO SUMÁRIO ---
        Elements tocItems = doc.select(".toc-item");
        int markerIndex = 0;
        
        for (Element item : tocItems) {
            Element titleEl = item.selectFirst(".toc-title");
            Element pageNumEl = item.selectFirst(".toc-page-num");
            
            if (titleEl != null && pageNumEl != null) {
                String titleText = titleEl.text().trim();
                
                Elements headers = doc.select("h1, h2, h3, h4, h5, h6");
                for (Element header : headers) {
                    if (header.text().toUpperCase().contains(titleText.toUpperCase()) && !header.hasClass("toc-title")) {
                        String marker = "@@MK" + markerIndex + "@@";
                        header.prepend("<span class='pdf-marker' style='color: white; font-size: 4px;'>" + marker + "</span>");
                        item.attr("data-marker", marker);
                        markerIndex++;
                        break;
                    }
                }
            }
        }
        
        // --- PREPARAÇÃO DAS NOTAS DE RODAPÉ ---
        Elements footnoteRefs = doc.select("sup.footnote-ref");
        Map<String, String> footnoteTexts = new HashMap<>();
        int fnMarkerIndex = 0;
        
        // Extrair os textos das notas e remover a div final
        Element footnotesContainer = doc.selectFirst(".editor-footnotes");
        if (footnotesContainer != null) {
            Elements noteDivs = footnotesContainer.select("div");
            for (Element noteDiv : noteDivs) {
                String fullText = noteDiv.text().trim();
                int bracketIndex = fullText.indexOf("]");
                if (bracketIndex != -1 && bracketIndex < fullText.length() - 1) {
                    String noteNum = fullText.substring(1, bracketIndex).replaceAll("[\\[\\]]", "").trim();
                    String noteContent = fullText.substring(bracketIndex + 1).trim();
                    footnoteTexts.put(noteNum, noteContent);
                }
            }
            footnotesContainer.remove(); // Remove do HTML final para não imprimir duplicado no fim
        }

        for (Element ref : footnoteRefs) {
            String noteNum = ref.text().replaceAll("[\\[\\]]", "").trim();
            String content = footnoteTexts.getOrDefault(noteNum, ref.attr("title"));
            
            String fnMarker = "@@FN_MK" + fnMarkerIndex + "@@";
            ref.after("<span class='pdf-fn-marker' style='color: white; font-size: 4px;'>" + fnMarker + "</span>");
            ref.attr("data-fn-marker", fnMarker);
            ref.attr("data-fn-content", content);
            ref.attr("data-fn-num", noteNum);
            fnMarkerIndex++;
        }
        
        String htmlPasso1 = doc.outerHtml();
        
        // 2. PASSADA 1: Gerar o PDF temporário
        byte[] pdfTemporario = renderizarPdfPlaywright(htmlPasso1, true, docName, docVersion); // true = margem normal
        
        // 3. MAPEAMENTO: Descobrir em quais páginas os marcadores caíram usando PDFBox
        Map<String, Integer> markerPages = new HashMap<>();
        Map<String, Integer> fnMarkerPages = new HashMap<>();
        
        try (PDDocument pdfDocument = org.apache.pdfbox.Loader.loadPDF(pdfTemporario)) {
            PDFTextStripper stripper = new PDFTextStripper();
            
            for (int i = 1; i <= pdfDocument.getNumberOfPages(); i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String text = stripper.getText(pdfDocument); 
                
                // Mapeia Sumário
                for (int m = 0; m < markerIndex; m++) {
                    String marker = "@@MK" + m + "@@";
                    if (text.contains(marker)) {
                        markerPages.put(marker, i); 
                    }
                }
                
                // Mapeia Notas de Rodapé
                for (int m = 0; m < fnMarkerIndex; m++) {
                    String fnMarker = "@@FN_MK" + m + "@@";
                    if (text.contains(fnMarker)) {
                        fnMarkerPages.put(fnMarker, i);
                    }
                }
            }
        }
        
        // 4. ATUALIZAÇÃO: Substituir os números no HTML e organizar rodapés
        for (Element item : doc.select(".toc-item")) {
            String marker = item.attr("data-marker");
            if (marker != null && !marker.isEmpty() && markerPages.containsKey(marker)) {
                Element pageNumEl = item.selectFirst(".toc-page-num");
                if (pageNumEl != null) {
                    pageNumEl.text(String.valueOf(markerPages.get(marker)));
                }
            }
        }
        
        // Organiza as notas de rodapé por página
        Map<Integer, List<String>> pageFootnotes = new HashMap<>();
        for (Element ref : doc.select("sup.footnote-ref")) {
            String fnMarker = ref.attr("data-fn-marker");
            if (fnMarker != null && !fnMarker.isEmpty() && fnMarkerPages.containsKey(fnMarker)) {
                int page = fnMarkerPages.get(fnMarker);
                String num = ref.attr("data-fn-num");
                String content = ref.attr("data-fn-content");
                pageFootnotes.computeIfAbsent(page, k -> new ArrayList<>()).add("[" + num + "] " + content);
            }
        }
        
        // Limpeza: Remover os marcadores invisíveis para não poluir o HTML final
        doc.select(".pdf-marker").remove();
        doc.select(".pdf-fn-marker").remove();
        
        String htmlFinal = doc.outerHtml();
        
        // 5. PASSADA 2: Gerar o PDF final com o sumário preenchido
        byte[] pdfFinal = renderizarPdfPlaywright(htmlFinal, !pageFootnotes.isEmpty() ? false : true, docName, docVersion); // false = margem maior se houver notas
        
        // 6. DESENHAR AS NOTAS DE RODAPÉ DIRETAMENTE NO PDF
        if (!pageFootnotes.isEmpty()) {
            try (PDDocument pdfDoc = org.apache.pdfbox.Loader.loadPDF(pdfFinal)) {
                PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                float fontSize = 8f;
                float marginX = 28f; // ~10mm da borda esquerda
                float maxWidth = 530f; // Largura do texto antes de quebrar a linha
                
                for (Map.Entry<Integer, List<String>> entry : pageFootnotes.entrySet()) {
                    int pageNum = entry.getKey();
                    if (pageNum <= pdfDoc.getNumberOfPages()) {
                        PDPage page = pdfDoc.getPage(pageNum - 1); // 0-indexed
                        float startY = 65f; // Começa a desenhar as notas em Y = 65 (~23mm do fim da página)
                        
                        try (PDPageContentStream contentStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                            contentStream.setFont(font, fontSize);
                            contentStream.setNonStrokingColor(100/255f, 116/255f, 139/255f); // Slate 500 (#64748b)
                            
                            // Desenhar linha separadora
                            contentStream.setStrokingColor(200/255f, 200/255f, 200/255f);
                            contentStream.moveTo(marginX, startY + 12f);
                            contentStream.lineTo(marginX + 150f, startY + 12f);
                            contentStream.stroke();
                            
                            for (String note : entry.getValue()) {
                                String safeNote = cleanTextForPDFBox(note);
                                List<String> lines = splitText(safeNote, font, fontSize, maxWidth);
                                
                                for (String line : lines) {
                                    contentStream.beginText();
                                    contentStream.newLineAtOffset(marginX, startY);
                                    contentStream.showText(line);
                                    contentStream.endText();
                                    startY -= 10f; // Altura da linha
                                }
                                startY -= 4f; // Espaçamento entre notas
                            }
                        }
                    }
                }
                
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                pdfDoc.save(baos);
                return baos.toByteArray();
            }
        }
        
        return pdfFinal;
    }
    
    /**
     * Limpa caracteres que podem causar crash na fonte Helvetica padrão do PDFBox
     */
    private String cleanTextForPDFBox(String text) {
        if (text == null) return "";
        return text.replace('\u2013', '-')
                   .replace('\u2014', '-')
                   .replace('\u2018', '\'')
                   .replace('\u2019', '\'')
                   .replace('\u201C', '"')
                   .replace('\u201D', '"')
                   .replaceAll("[\\p{Cntrl}]", ""); // Remove caracteres de controle invisíveis
    }
    
    /**
     * Quebra o texto em múltiplas linhas respeitando a largura máxima da página
     */
    private List<String> splitText(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();
        
        for (String word : words) {
            String testLine = currentLine.length() > 0 ? currentLine.toString() + " " + word : word;
            
            float width = 0;
            try {
                width = font.getStringWidth(testLine) / 1000 * fontSize;
            } catch (Exception e) {
                // Se algum caracter da palavra não for suportado pela fonte, engole a exceção e ignora o tamanho dele
                width = currentLine.length() * fontSize * 0.5f; 
            }
            
            if (width > maxWidth && currentLine.length() > 0) {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    /**
     * Método auxiliar isolado para chamar o Playwright
     */
    private byte[] renderizarPdfPlaywright(String html, boolean isTempPass, String docName, String docVersion) {
        Map<String, String> env = new HashMap<>(System.getenv());
        // env.put("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1");

        
        try (Playwright playwright = Playwright.create(new Playwright.CreateOptions().setEnv(env))) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            Page page = browser.newPage();
            
            page.setContent(html);
            page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE);
            
            // Aumentar a margem inferior na passada final se existirem notas de rodapé
            String bottomMargin = isTempPass ? "12mm" : "30mm";
            
            String safeDocName = (docName != null) ? docName : "";
            String safeDocVersion = (docVersion != null) ? docVersion : "";

            Page.PdfOptions pdfOptions = new Page.PdfOptions()
                .setPrintBackground(true)
                .setDisplayHeaderFooter(true)
                .setMargin(new com.microsoft.playwright.options.Margin()
                    .setTop("10mm")
                    .setBottom(bottomMargin)
                    .setLeft("10mm")
                    .setRight("10mm"))
                .setHeaderTemplate("<div></div>")
                // O rodapé com as classes nativas do Chrome para numeração de página e as novas informações
                .setFooterTemplate(
                    "<div style='width: 100%; margin: 0 10mm; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; font-size: 10px; font-family: \"Arial\", sans-serif; color: #64748b;'>" +
                    "<div style='text-align: left;'>" + safeDocName + "</div>" +
                    "<div style='text-align: center; font-style: italic;'>" + safeDocVersion + "</div>" +
                    "<div style='text-align: right;'><span class=\"pageNumber\"></span></div>" +
                    "</div>"
                );
                
            return page.pdf(pdfOptions);
        }
    }
    public byte[] gerarPdfSemSumario(String htmlContent, String docName, String docVersion) throws IOException {
        Document doc = Jsoup.parse(htmlContent);
        
        // --- INJEÇÃO DE ESTILOS OBRIGATÓRIOS PARA O PDF ---
        String css = "<style>" +
            "body, p, div, td, th, span, li, blockquote, .editor-content { font-family: 'Calibri', sans-serif !important; font-size: 12pt !important; }" +
            ".img-caption, .img-caption *, .img-source, .img-date { font-family: 'Calibri', sans-serif !important; font-size: 10pt !important; color: black !important; text-align: center !important; }" +
            ".img-title, .img-title * { font-family: 'Calibri', sans-serif !important; font-size: 14pt !important; font-weight: bold !important; text-align: center !important; }" +
            "</style>";
        doc.head().append(css);

        String htmlFinal = doc.outerHtml();
        return renderizarPdfSimples(htmlFinal, docName, docVersion);
    }

    private byte[] renderizarPdfSimples(String html, String docName, String docVersion) {
        Map<String, String> env = new HashMap<>(System.getenv());
        // env.put("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1");

        
        try (Playwright playwright = Playwright.create(new Playwright.CreateOptions().setEnv(env))) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            Page page = browser.newPage();
            
            page.setContent(html);
            page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE);
            
            String safeDocName = (docName != null) ? docName : "";
            String safeDocVersion = (docVersion != null) ? docVersion : "";

            Page.PdfOptions pdfOptions = new Page.PdfOptions()
                .setPrintBackground(true)
                .setDisplayHeaderFooter(true)
                .setMargin(new com.microsoft.playwright.options.Margin()
                    .setTop("10mm")
                    .setBottom("12mm")
                    .setLeft("10mm")
                    .setRight("10mm"))
                .setHeaderTemplate("<div></div>")
                .setFooterTemplate(
                    "<div style='width: 100%; margin: 0 10mm; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; font-size: 10px; font-family: \"Arial\", sans-serif; color: #64748b;'>" +
                    "<div style='text-align: left;'>" + safeDocName + "</div>" +
                    "<div style='text-align: center; font-style: italic;'>" + safeDocVersion + "</div>" +
                    "<div style='text-align: right;'><span class=\"pageNumber\"></span></div>" +
                    "</div>"
                );
                
            return page.pdf(pdfOptions);
        }
    }
}
