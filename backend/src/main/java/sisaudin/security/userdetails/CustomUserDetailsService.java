package sisaudin.security.userdetails;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private PessoaRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        if (!username.contains("@")) {
            username += "@ghc.com.br";
        }
        Pessoa user = userRepository.findByEmail(username);

        if (user == null) {
            System.out.println("User Not Found!");
            throw new UsernameNotFoundException("User Not Found!");
        }

        return new CustomUserDetails(user);
    }
    
}