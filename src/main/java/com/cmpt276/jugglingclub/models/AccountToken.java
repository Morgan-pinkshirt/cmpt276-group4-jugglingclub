package com.cmpt276.jugglingclub.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "account_tokens")
public class AccountToken {

    public enum TokenType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private user account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenType type;

    private String pendingEmail;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private boolean used = false;

    public AccountToken() {
    }

    public AccountToken(String tokenHash, user account,
                        TokenType type, String pendingEmail,
                        LocalDateTime expiresAt) {
        this.tokenHash = tokenHash;
        this.account = account;
        this.type = type;
        this.pendingEmail = pendingEmail;
        this.expiresAt = expiresAt;
    }

    public Long getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public user getAccount() {
        return account;
    }

    public TokenType getType() {
        return type;
    }

    public String getPendingEmail() {
        return pendingEmail;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}