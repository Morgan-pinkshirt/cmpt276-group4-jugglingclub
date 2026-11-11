package com.cmpt276.jugglingclub.services;

import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.models.user;

import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class AccountTokenService {

    private final AccountTokenRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccountTokenService(AccountTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public String createToken(user account, TokenType type, String pendingEmail) {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        String tokenHash = hashToken(token);

        AccountToken accountToken = new AccountToken(
                tokenHash,
                account,
                type,
                pendingEmail,
                LocalDateTime.now().plusMinutes(30)
        );

        tokenRepository.save(accountToken);

        return token;
    }

    public Optional<AccountToken> validateToken(String token, TokenType type) {

        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        String tokenHash = hashToken(token);

        Optional<AccountToken> result =
                tokenRepository.findByTokenHash(tokenHash);

        if (result.isEmpty()) {
            return Optional.empty();
        }

        AccountToken accountToken = result.get();

        if (accountToken.isUsed()
                || accountToken.getType() != type
                || LocalDateTime.now().isAfter(accountToken.getExpiresAt())) {
            return Optional.empty();
        }

        return Optional.of(accountToken);
    }

    public void markUsed(AccountToken token) {
        token.setUsed(true);
        tokenRepository.save(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}