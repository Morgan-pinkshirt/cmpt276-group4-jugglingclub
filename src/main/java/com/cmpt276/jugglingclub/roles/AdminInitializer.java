package com.cmpt276.jugglingclub.roles;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

@Component
@Profile("admin-seed")
public class AdminInitializer implements CommandLineRunner {

    private final usersRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${ADMIN_SEED_PASSWORD:}")
    private String initialPassword;

    public AdminInitializer(usersRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (initialPassword.isBlank()) {
            throw new IllegalStateException("ADMIN_SEED_PASSWORD is required");
        }

        String[] usernames = {"cla572", "kga90", "lnt7", "msn17", "zla315"};

        for (String username : usernames) {
            if (userRepository.findByName(username).isEmpty()) {
                user admin = new user(username, passwordEncoder.encode(initialPassword));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
                System.out.println("Created admin: " + username);
            } else {
                System.out.println("Account already exists: " + username);
            }
        }

        String superAdminUsername = "joker";

        if (userRepository.findByName(superAdminUsername).isEmpty()) {
            user superAdmin = new user(
                    superAdminUsername,
                    passwordEncoder.encode(initialPassword)
            );
            superAdmin.setRole(Role.SUPER_ADMIN);
            userRepository.save(superAdmin);
            System.out.println("Created super admin: " + superAdminUsername);
        } else {
            System.out.println("Account already exists: " + superAdminUsername);
        }
    }
}
