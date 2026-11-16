package com.cmpt276.jugglingclub.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class Email {

    private final RestClient restClient;
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;

    public Email(
            @Value("${brevo.api.key}") String apiKey,
            @Value("${brevo.sender.email}") String senderEmail,
            @Value("${brevo.sender.name}") String senderName) {

        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;

        this.restClient = RestClient.create();
    }

    public void sendVerificationEmail(String email, String verificationLink) {

        String subject = "The Jester Club - Email Verification";

        String content =
                "Please click the following link to verify your email address:\n\n"
                + verificationLink
                + "\n\nIf you did not request this, please ignore this email.";

        sendEmail(email, subject, content);
    }

    public void sendPasswordResetEmail(String email, String resetLink) {

        String subject = "The Jester Club - Password Reset";

        String content ="You requested to reset your password.\n\n"
                        + "Please click the following link to reset your password:\n\n"
                        + resetLink
                        + "\n\nThis link will expire in 30 minutes."
                        + "\n\nIf you did not request this, please ignore this email.";

        sendEmail(email, subject, content);
    }

    private void sendEmail(String recipient, String subject, String content) {

        Map<String, Object> requestBody = Map.of(
                "sender", Map.of(
                        "name", senderName,
                        "email", senderEmail
                ),
                "to", List.of(
                        Map.of("email", recipient)
                ),
                "subject", subject,
                "textContent", content
        );

        restClient.post()
                .uri("https://api.brevo.com/v3/smtp/email")
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
    }
}