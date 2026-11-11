package com.cmpt276.jugglingclub.models;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountTokenRepository extends JpaRepository<AccountToken, Long> {

    Optional<AccountToken> findByTokenHash(String tokenHash);

}