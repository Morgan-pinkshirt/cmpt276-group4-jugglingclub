package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import com.cmpt276.jugglingclub.services.Email;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestClientException;

@Controller
public class EmailVerificationController {

    private final AccountTokenService tokenService;
    private final usersRepository userRepository;
    private final Email emailService;
    private final AccountTokenRepository tokenRepository;

    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public EmailVerificationController(
            AccountTokenService tokenService,
            usersRepository userRepository,
            Email emailService,
            AccountTokenRepository tokenRepository) {

        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.tokenRepository = tokenRepository;
    }

    @Transactional
    @GetMapping("/verify-email")
    public String verifyEmail(
            @RequestParam String token,
            Model model) {

        AccountToken accountToken = tokenService
                .validateToken(token, TokenType.EMAIL_VERIFICATION)
                .orElse(null);

        if (accountToken == null) {
            model.addAttribute("message",
                    "Invalid or expired verification link.");
            return "users/result";
        }

        user account = accountToken.getAccount();
        String newEmail = accountToken.getPendingEmail();

        if (newEmail == null || newEmail.isBlank()) {
            model.addAttribute("message",
                    "Invalid email verification request.");
            return "users/result";
        }

        user existingUser = userRepository
                .findByEmailIgnoreCase(newEmail)
                .orElse(null);

        if (existingUser != null &&
                existingUser.getUid() != account.getUid()) {

            model.addAttribute("message",
                    "This email is already linked to another account.");
            return "users/result";
        }

        account.setEmail(newEmail);
        account.setEmailVerified(true);

        userRepository.save(account);
        tokenService.markUsed(accountToken);

        model.addAttribute("message",
                "Your email has been verified successfully!");

        return "users/result";
    }

    @PostMapping("/account/email/request")
    public String requestEmailVerification(
            @RequestParam String email,
            @RequestParam(required = false) String password,
            HttpSession session,
            Model model) {

        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user account = userRepository.findById(sessionUser.getUid())
                .orElse(null);

        if (account == null) {
            return "redirect:/userlogin";
        }

        if (account.getEmail() != null && !account.getEmail().isBlank()) {

            if (password == null ||
                    !passwordEncoder.matches(password, account.getPassword())) {

                model.addAttribute("user", account);
                model.addAttribute("emailPasswordError", "Incorrect password.");
                model.addAttribute("emailValue", email);
                return "roles/settings";
            }
        }

        String newEmail = email.trim();

        if (newEmail.isBlank()) {
            model.addAttribute("user", account);
            model.addAttribute("emailError", "Please enter an email address.");
            return "roles/settings";
        }

        user existingUser = userRepository.findByEmailIgnoreCase(newEmail)
                .orElse(null);

        if (existingUser != null &&
                existingUser.getUid() != account.getUid()) {

            model.addAttribute("user", account);
            model.addAttribute("emailValue", newEmail);
            model.addAttribute("emailError", "This email address is already in use.");
            return "roles/settings";
        }

        if (!newEmail.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+$")) {
            model.addAttribute("user", account);
            model.addAttribute("emailValue", newEmail);
            model.addAttribute("emailError", "Please enter a valid email address.");
            return "roles/settings";
        }

        String token = tokenService.createToken(
                account,
                TokenType.EMAIL_VERIFICATION,
                newEmail
        );

        String verificationLink =
                baseUrl + "/verify-email?token=" + token;

        try {
            emailService.sendVerificationEmail(newEmail, verificationLink);
        } catch (RestClientException e) {
            tokenService.validateToken(token, TokenType.EMAIL_VERIFICATION)
                    .ifPresent(tokenService::markUsed);
            model.addAttribute("user", account);
            model.addAttribute("emailValue", newEmail);
            model.addAttribute("emailError", "Verification email could not be sent. Please try again.");
            return "roles/settings";
        }

        model.addAttribute("message",
                "A verification email has been sent. Please check your inbox.");

        return "users/result";
    }
}