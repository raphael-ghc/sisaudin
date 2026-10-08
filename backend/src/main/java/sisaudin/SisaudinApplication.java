package sisaudin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SisaudinApplication {

    public static void main(String[] args) {
        SpringApplication.run(SisaudinApplication.class, args);
    }

}

