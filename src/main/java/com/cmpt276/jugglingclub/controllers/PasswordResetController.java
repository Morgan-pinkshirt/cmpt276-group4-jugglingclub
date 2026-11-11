package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import com.cmpt276.jugglingclub.services.Email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Controller
public class PasswordResetController {

    private final usersRepository userRepository;
    private final AccountTokenService tokenService;
    private final Email emailService;

    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public PasswordResetController(
            usersRepository userRepository,
            AccountTokenService tokenService,
            Email emailService) {

        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.emailService = emailService;
    }

    
    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "users/forgot-password";
    }

    
    @PostMapping("/forgot-password/email")
    public String requestPasswordReset(
            @RequestParam String email,
            Model model) {

        String normalizedEmail = email.trim();

        String message =
                "If this email is registered and verified, "
                + "a password reset link will be sent.";

        if (normalizedEmail.isBlank()) {
            model.addAttribute("message", message);
            return "users/result";
        }

        user account = userRepository.findByEmail(normalizedEmail)
                .orElse(null);

        if (account != null && account.isEmailVerified()) {

            String token = tokenService.createToken(
                    account,
                    TokenType.PASSWORD_RESET,
                    null
            );

            String resetLink =
                    baseUrl + "/reset-password?token=" + token;

            emailService.sendPasswordResetEmail(
                    normalizedEmail,
                    resetLink
            );
        }

        model.addAttribute("message", message);
        return "users/result";
    }

    
    @GetMapping("/reset-password")
    public String showResetPassword(
            @RequestParam String token,
            Model model) {

        AccountToken accountToken = tokenService.validateToken(
                token,
                TokenType.PASSWORD_RESET
        ).orElse(null);

        if (accountToken == null) {
            model.addAttribute(
                    "message",
                    "Invalid or expired password reset link."
            );

            return "users/result";
        }

        model.addAttribute("token", token);
        return "users/reset-password";
    }

    
    @Transactional
    @PostMapping("/reset-password")
    public String resetPassword(
            @RequestParam String token,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            Model model) {

        System.out.println("=== PASSWORD RESET POST RECEIVED ===");

        
        if (!password.equals(confirmPassword)) {

            System.out.println(
                    "RESET FAILED: Passwords do not match."
            );

            model.addAttribute(
                    "message",
                    "Passwords do not match."
            );
            model.addAttribute("token", token);

            return "users/reset-error";
        }

        
        
        
        AccountToken accountToken = tokenService.validateToken(
                token,
                TokenType.PASSWORD_RESET
        ).orElse(null);

        if (accountToken == null) {

            System.out.println(
                    "RESET FAILED: Invalid or expired token."
            );

            model.addAttribute(
                    "message",
                    "Invalid or expired password reset link."
            );

            return "users/result";
        }

        System.out.println("RESET: Token validated successfully.");

        
        user account = accountToken.getAccount();

        System.out.println(
                "RESET: Account UID = " + account.getUid()
        );

        System.out.println(
                "RESET: Username = " + account.getName()
        );

       
        String encryptedPassword =
                passwordEncoder.encode(password);

        account.setPassword(encryptedPassword);

       
        userRepository.saveAndFlush(account);

        System.out.println(
                "RESET: Password update flushed to database."
        );

        
        user updatedAccount = userRepository
                .findById(account.getUid())
                .orElseThrow();

        boolean passwordUpdated = passwordEncoder.matches(
                password,
                updatedAccount.getPassword()
        );

        System.out.println(
                "RESET: New password matches = " + passwordUpdated
        );

        if (!passwordUpdated) {
            throw new IllegalStateException(
                    "Password verification failed after update."
            );
        }

     
        tokenService.markUsed(accountToken);

        System.out.println("RESET: Token marked as used.");
        System.out.println("=== PASSWORD RESET COMPLETED ===");

        model.addAttribute(
                "message",
                "Your password has been reset successfully."
        );

        return "users/result";
    }
}


