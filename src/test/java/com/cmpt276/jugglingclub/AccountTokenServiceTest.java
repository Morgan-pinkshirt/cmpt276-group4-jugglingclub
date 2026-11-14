package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AccountTokenServiceTest {

    @Mock
    private AccountTokenRepository tokenRepository;

    @InjectMocks
    private AccountTokenService tokenService;

    @Test
    void testCreateToken() {

        user u1 = new user("billy", "bob");

        LocalDateTime before = LocalDateTime.now();

        String token = tokenService.createToken(
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com"
        );

        LocalDateTime after = LocalDateTime.now();

        assertNotNull(token);
        assertFalse(token.isBlank());

        ArgumentCaptor<AccountToken> captor =
                ArgumentCaptor.forClass(AccountToken.class);

        verify(tokenRepository).save(captor.capture());

        AccountToken savedToken = captor.getValue();

        assertNotNull(savedToken.getTokenHash());
        assertNotEquals(token, savedToken.getTokenHash());
        assertEquals(64, savedToken.getTokenHash().length());

        assertEquals(u1, savedToken.getAccount());
        assertEquals(TokenType.EMAIL_VERIFICATION, savedToken.getType());
        assertEquals("billy@example.com", savedToken.getPendingEmail());
        assertFalse(savedToken.isUsed());

        assertFalse(savedToken.getExpiresAt().isBefore(before.plusMinutes(30)));
        assertFalse(savedToken.getExpiresAt().isAfter(after.plusMinutes(30)));
    }



    @Test
    void testValidateToken() {
        user u1 = new user("billy", "bob");

        String token = tokenService.createToken(
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com"
        );

        ArgumentCaptor<AccountToken> captor =
                ArgumentCaptor.forClass(AccountToken.class);

        verify(tokenRepository).save(captor.capture());

        AccountToken savedToken = captor.getValue();

        when(tokenRepository.findByTokenHash(savedToken.getTokenHash()))
                .thenReturn(Optional.of(savedToken));

        Optional<AccountToken> result = tokenService.validateToken(
                token,
                TokenType.EMAIL_VERIFICATION
        );

        assertTrue(result.isPresent());
        assertEquals(savedToken, result.get());
        assertEquals(u1, result.get().getAccount());
        assertEquals(TokenType.EMAIL_VERIFICATION, result.get().getType());
        assertFalse(result.get().isUsed());

        verify(tokenRepository).findByTokenHash(savedToken.getTokenHash());
    }

    @Test
    void testInvalidToken() {
        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.empty());

        Optional<AccountToken> result1 = tokenService.validateToken(
                "invalidToken",
                TokenType.EMAIL_VERIFICATION
        );

        Optional<AccountToken> result2 = tokenService.validateToken(
                null,
                TokenType.EMAIL_VERIFICATION
        );

        Optional<AccountToken> result3 = tokenService.validateToken(
                "",
                TokenType.EMAIL_VERIFICATION
        );

        assertTrue(result1.isEmpty());
        assertTrue(result2.isEmpty());
        assertTrue(result3.isEmpty());

        verify(tokenRepository, times(1)).findByTokenHash(anyString());
    }


    @Test
    void testExpiredToken() {
        user u1 = new user("billy", "bob");

        AccountToken expiredToken = new AccountToken(
                "expiredHash",
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com",
                LocalDateTime.now().minusMinutes(1)
        );

        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(expiredToken));

        Optional<AccountToken> result = tokenService.validateToken(
                "expiredToken",
                TokenType.EMAIL_VERIFICATION
        );

        assertTrue(result.isEmpty());

        verify(tokenRepository).findByTokenHash(anyString());
    }

    @Test
    void testWrongTokenType() {
        user u1 = new user("billy", "bob");

        AccountToken wrongTypeToken = new AccountToken(
                "wrongTypeHash",
                u1,
                TokenType.PASSWORD_RESET,
                null,
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(wrongTypeToken));

        Optional<AccountToken> result = tokenService.validateToken(
                "wrongTypeToken",
                TokenType.EMAIL_VERIFICATION
        );

        assertTrue(result.isEmpty());

        verify(tokenRepository).findByTokenHash(anyString());
    }


    @Test
    void testUsedToken() {
        user u1 = new user("billy", "bob");

        AccountToken usedToken = new AccountToken(
                "usedHash",
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com",
                LocalDateTime.now().plusMinutes(30)
        );

        usedToken.setUsed(true);

        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(usedToken));

        Optional<AccountToken> result = tokenService.validateToken(
                "usedToken",
                TokenType.EMAIL_VERIFICATION
        );

        assertTrue(result.isEmpty());

        verify(tokenRepository).findByTokenHash(anyString());
    }

    @Test
    void testMarkUsed() {
        user u1 = new user("billy", "bob");

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.PASSWORD_RESET,
                null,
                LocalDateTime.now().plusMinutes(30)
        );

        assertFalse(token.isUsed());

        tokenService.markUsed(token);

        assertTrue(token.isUsed());

        verify(tokenRepository).save(token);
        verify(tokenRepository, times(1)).save(token);
    }



}


