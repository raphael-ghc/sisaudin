package sisaudin.security.config;

import jakarta.servlet.http.HttpServletRequest;
import sisaudin.security.jwt.JwtAccessDeniedHandler;
import sisaudin.security.jwt.JwtAuthenticationEntryPoint;
import sisaudin.security.jwt.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /*
    @Autowired
    private UserDetailsService userDetailsService;
    * */

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {

        return httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(req -> req
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/**").permitAll() //authenticated()   // Todos os CRUDs genéricos exigem o token
                        .requestMatchers("/ws-collab/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Front embutido no JAR: só leitura (GET) de index.html, assets e rotas do React
                        .requestMatchers(SecurityConfig::isPaginaDoFront).permitAll()
                        .anyRequest().authenticated())
// using JWT            .httpBasic(Customizer.withDefaults())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .cors(cors -> cors
                        .configurationSource(request -> {
                            CorsConfiguration config = new CorsConfiguration();
                            config.setAllowedOriginPatterns(List.of("*"));
                            config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                            config.setAllowedHeaders(List.of("*"));
                            config.setExposedHeaders(List.of("Authorization", "Content-Type"));
                            config.setAllowCredentials(true);
                            return config;
                        }))
                .build();

        // httpSecurity.formLogin(Customizer.withDefaults());
    }

    private static boolean isPaginaDoFront(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return "GET".equals(request.getMethod())
                && !path.startsWith("/api/")
                && !path.startsWith("/uploads/");
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /*
    // Deprecated,  no use!!!

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(new BCryptPasswordEncoder(12));
        provider.setUserDetailsService(userDetailsService);
        return provider;
    }
    * */

    /*
    @Bean
    public UserDetailsService userDetailsService(){

        UserDetails user = User
                .withDefaultPasswordEncoder()
                .username("mahmud")
                .password("mahmud")
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(user  );
    }
    * */
}
