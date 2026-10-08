package sisaudin.events;

import org.springframework.context.ApplicationEvent;

public class UserRegistradoEvent extends ApplicationEvent {
    private final String email;
    private final String userName;

    public UserRegistradoEvent(Object source, String email, String userName) {
        super(source);
        this.email = email;
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }
    public String getUserName() {
        return userName;
    }
}