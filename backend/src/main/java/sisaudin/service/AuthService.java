package sisaudin.service;

import sisaudin.dto.request.LoginRequest;
import sisaudin.dto.request.RegisterRequest;
import sisaudin.dto.response.AuthResponse;
import sisaudin.model.RefreshToken;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.repository.RefreshTokenRepository;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import sisaudin.security.jwt.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PessoaRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    public AuthResponse login(LoginRequest request) {
        try {
            String requestUsername = request.getUsername().toLowerCase();
            if (!requestUsername.contains("@")) {
                requestUsername += "@ghc.com.br";
            }
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            requestUsername, request.getPassword()));

            if (authentication.isAuthenticated()) {
                Pessoa user = userRepository.findByEmail(requestUsername);

                // Delete existing refresh tokens for user
                refreshTokenRepository.deleteByUser(user);
                refreshTokenRepository.flush(); // <-- force delete to DB

                String accessToken = jwtService.generateAccessToken(user);
                String refreshTokenStr = jwtService.generateRefreshToken(user);

                RefreshToken refreshToken = RefreshToken.builder()
                        .token(refreshTokenStr)
                        .user(user)
                        .expiryDate(new Date(System.currentTimeMillis() + jwtService.getRefreshTokenValidity()))
                        .build();

                refreshTokenRepository.save(refreshToken);

                return new AuthResponse(true, accessToken, refreshTokenStr, null);
            }
        } catch (AuthenticationException e){
            return new AuthResponse(false,null, null,"Invalid credentials.");
        }

        return new AuthResponse(false, null, null, "Authentication failed.");
    }

    public AuthResponse register(RegisterRequest request) {
        try {
            String requestUsername = request.getUsername().toLowerCase();
            String requestEmail = request.getEmail().toLowerCase();
            
            // Note: username is not unique in Pessoa, we use email as the unique identifier for auth
            if(userRepository.findByEmail(requestEmail) != null){
                return new AuthResponse(false, null, null, "Email already exists.");
            }

            Pessoa user = Pessoa.builder()
                    .email(requestEmail)
                    .nome(requestUsername) // Temporário até ajustar o DTO
                    .cartaoPonto("novo_" + System.currentTimeMillis()) // valor único provisório
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Pessoa.Role.VISITANTE)
                    .status("ACTIVE")
                    .build();

            userRepository.save(user);

            String accessToken = jwtService.generateAccessToken(user);
            String refreshTokenStr = jwtService.generateRefreshToken(user);

            RefreshToken refreshToken = RefreshToken.builder()
                    .token(refreshTokenStr)
                    .user(user)
                    .expiryDate(new Date(System.currentTimeMillis() + jwtService.getRefreshTokenValidity()))
                    .build();

            refreshTokenRepository.save(refreshToken);

            return new AuthResponse(true, accessToken, refreshTokenStr, null);

        } catch (Exception e) {
            e.printStackTrace();
            return new AuthResponse(false, null, null, "User registration failed.");
        }
    }

    public AuthResponse refreshToken(String refreshTokenStr) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshTokenStr);

        if (tokenOpt.isEmpty() || !jwtService.isRefreshTokenValid(refreshTokenStr)) {
            return new AuthResponse(false, null, null, "Invalid or expired refresh token.");
        }

        Pessoa user = tokenOpt.get().getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        return new AuthResponse(true, newAccessToken, null, null);
    }
}
