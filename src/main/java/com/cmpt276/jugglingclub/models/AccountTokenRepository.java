package com.cmpt276.jugglingclub.models;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;

public interface AccountTokenRepository extends JpaRepository<AccountToken, Long> {

    Optional<AccountToken> findByTokenHash(String tokenHash);

    boolean existsByPendingEmailIgnoreCaseAndTypeAndUsedFalseAndExpiresAtAfter(
            String pendingEmail,
            AccountToken.TokenType type,
            LocalDateTime now
    );

    List<AccountToken> findByAccountAndTypeAndUsedFalse(user account, AccountToken.TokenType type);

    void deleteByAccount(user account);
}