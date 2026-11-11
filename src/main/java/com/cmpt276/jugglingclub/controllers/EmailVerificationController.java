package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.AccountToken;
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

@Controller
public class EmailVerificationController {

    private final AccountTokenService tokenService;
    private final usersRepository userRepository;
    private final Email emailService;

    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public EmailVerificationController(
            AccountTokenService tokenService,
            usersRepository userRepository,
            Email emailService) {

        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.emailService = emailService;
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
                .findByEmail(newEmail)
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

        // Changing an existing email requires the current password.
        if (account.getEmail() != null && !account.getEmail().isBlank()) {

            if (password == null ||
                    !passwordEncoder.matches(password, account.getPassword())) {

                model.addAttribute("message", "Incorrect password.");
                return "users/result";
            }
        }

        // Check whether the email is already linked to another account.
        String newEmail = email.trim();

        if (newEmail.isBlank()) {
            model.addAttribute("message", "Please enter an email address.");
            return "users/result";
        }

        user existingUser = userRepository.findByEmail(newEmail)
                .orElse(null);

        if (existingUser != null &&
                existingUser.getUid() != account.getUid()) {

            model.addAttribute("message",
                    "This email is already linked to another account.");
            return "users/result";
        }

        // Generate and save a verification token.
        String token = tokenService.createToken(
                account,
                TokenType.EMAIL_VERIFICATION,
                newEmail
        );

        String verificationLink =
                baseUrl + "/verify-email?token=" + token;

        // Send the verification email through Brevo.
        emailService.sendVerificationEmail(newEmail, verificationLink);

        model.addAttribute("message",
                "A verification email has been sent. Please check your inbox.");

        return "users/result";
    }
}

