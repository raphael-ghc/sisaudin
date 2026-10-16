package sisaudin.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // Caminhos do backend que nunca devem cair no index.html do front
    private static final List<String> ROTAS_BACKEND =
            List.of("api/", "uploads/", "ws-collab", "v3/", "swagger-ui", "error");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/" + uploadPath + "/");

        // Front (build do Vite copiado para static/ no JAR). Arquivo inexistente
        // devolve o index.html, para o React Router tratar a rota.
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        if (!resourcePath.isEmpty()) {
                            Resource arquivo = location.createRelative(resourcePath);
                            if (arquivo.exists() && arquivo.isReadable()) {
                                return arquivo;
                            }
                        }
                        if (ROTAS_BACKEND.stream().anyMatch(resourcePath::startsWith)) {
                            return null;
                        }
                        Resource index = new ClassPathResource("/static/index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
