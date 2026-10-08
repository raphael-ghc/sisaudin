package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import sisaudin.model.cadastroBasico.AnexoDocumento;
import sisaudin.repository.cadastroBasico.AnexoDocumentoRepository;
import sisaudin.dto.AnexoDocumentoDTO;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AnexoDocumentoService {

    @Autowired
    private AnexoDocumentoRepository anexoDocumentoRepository;

    private final String UPLOAD_DIR = "uploads/";

    public AnexoDocumentoDTO upload(MultipartFile file, Long itemTrabalhoId, String documento, String secao, String responsavel) throws IOException {
        String baseDir = UPLOAD_DIR + documento.replaceAll("[^a-zA-Z0-9_-]", "_") + "/item_" + itemTrabalhoId + "/" + secao.replaceAll("[^a-zA-Z0-9_-]", "_") + "/";
        Path uploadPath = Paths.get(baseDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        AnexoDocumento anexo = new AnexoDocumento();
        anexo.setFileName(file.getOriginalFilename());
        anexo.setFileType(file.getContentType());
        anexo.setFilePath(filePath.toString());
        anexo.setDataHora(LocalDateTime.now());
        anexo.setResponsavel(responsavel != null && !responsavel.isEmpty() ? responsavel : "Auditor(a)");
        anexo.setItemTrabalhoId(itemTrabalhoId);
        anexo.setDocumento(documento);
        anexo.setSecao(secao);

        anexoDocumentoRepository.save(anexo);
        return toDTO(anexo);
    }

    public List<AnexoDocumentoDTO> getByItemTrabalhoAndDocumento(Long itemTrabalhoId, String documento) {
        return anexoDocumentoRepository.findByItemTrabalhoIdAndDocumento(itemTrabalhoId, documento)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<AnexoDocumento> getById(Long id) {
        return anexoDocumentoRepository.findById(id);
    }

    public void delete(Long id) {
        Optional<AnexoDocumento> anexoOpt = anexoDocumentoRepository.findById(id);
        if (anexoOpt.isPresent()) {
            AnexoDocumento anexo = anexoOpt.get();
            try {
                Files.deleteIfExists(Paths.get(anexo.getFilePath()));
            } catch (IOException e) {
                e.printStackTrace(); // Apenas loga, mas continua para remover do banco
            }
            anexoDocumentoRepository.deleteById(id);
        }
    }

    private AnexoDocumentoDTO toDTO(AnexoDocumento anexo) {
        AnexoDocumentoDTO dto = new AnexoDocumentoDTO();
        dto.setId(anexo.getId());
        dto.setFileName(anexo.getFileName());
        dto.setFileType(anexo.getFileType());
        dto.setDataHora(anexo.getDataHora());
        dto.setResponsavel(anexo.getResponsavel());
        dto.setItemTrabalhoId(anexo.getItemTrabalhoId());
        dto.setDocumento(anexo.getDocumento());
        dto.setSecao(anexo.getSecao());
        return dto;
    }
}
