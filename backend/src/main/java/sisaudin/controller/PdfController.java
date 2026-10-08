package sisaudin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.service.PdfGeneratorService;

import java.util.Map;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PdfController {

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    @PostMapping("/gerar")
    public ResponseEntity<byte[]> gerarPdf(@RequestBody Map<String, String> payload) {
        String htmlContent = payload.get("html");
        String docName = payload.get("docName");
        String docVersion = payload.get("docVersion");
        
        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

        try {
            byte[] pdfBytes = pdfGeneratorService.gerarPdfComSumario(htmlContent, docName, docVersion);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "relatorio.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/gerar-sem-sumario")
    public ResponseEntity<byte[]> gerarPdfSemSumario(@RequestBody Map<String, String> payload) {
        String htmlContent = payload.get("html");
        String docName = payload.get("docName");
        String docVersion = payload.get("docVersion");
        
        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

        try {
            byte[] pdfBytes = pdfGeneratorService.gerarPdfSemSumario(htmlContent, docName, docVersion);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "documento.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
