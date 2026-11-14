package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.controllers.EmailVerificationController;
import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import com.cmpt276.jugglingclub.services.Email;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.ui.Model;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailVerificationControllerTest {

    @Mock
    private AccountTokenService tokenService;

    @Mock
    private AccountTokenRepository tokenRepository;

    @Mock
    private usersRepository userRepository;

    @Mock
    private Email emailService;

    @Mock
    private Model model;

    @InjectMocks
    private EmailVerificationController controller;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                controller,
                "baseUrl",
                "http://localhost:8080"
        );

        ReflectionTestUtils.setField(
                controller,
                "tokenRepository",
                tokenRepository
        );
    }

    @Test
    void testVerifyEmail() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com",
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenService.validateToken(
                "validToken",
                TokenType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(token));

        when(userRepository.findByEmailIgnoreCase("billy@example.com"))
                .thenReturn(Optional.empty());

        String result = controller.verifyEmail("validToken", model);

        assertEquals("users/result", result);
        assertEquals("billy@example.com", u1.getEmail());
        assertTrue(u1.isEmailVerified());

        verify(userRepository).save(u1);
        verify(tokenService).markUsed(token);

        verify(model).addAttribute(
                "message",
                "Your email has been verified successfully!"
        );
    }

    @Test
    void testInvalidVerificationToken() {
        when(tokenService.validateToken(
                "invalidToken",
                TokenType.EMAIL_VERIFICATION
        )).thenReturn(Optional.empty());

        String result = controller.verifyEmail("invalidToken", model);

        assertEquals("users/result", result);

        verify(model).addAttribute(
                "message",
                "Invalid or expired verification link."
        );

        verifyNoInteractions(userRepository);
        verify(tokenService, never()).markUsed(any());
    }

    @Test
    void testEmailAlreadyUsed() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);
        u1.setEmail("old@example.com");

        user u2 = new user("john", "123");
        u2.setUid(2);
        u2.setEmail("billy@example.com");

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com",
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenService.validateToken(
                "validToken",
                TokenType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(token));

        when(userRepository.findByEmailIgnoreCase("billy@example.com"))
                .thenReturn(Optional.of(u2));

        String result = controller.verifyEmail("validToken", model);

        assertEquals("users/result", result);
        assertEquals("old@example.com", u1.getEmail());
        assertFalse(u1.isEmailVerified());

        verify(userRepository, never()).save(any());
        verify(tokenService, never()).markUsed(any());

        verify(model).addAttribute(
                "message",
                "This email is already linked to another account."
        );
    }

    @Test
    void testInvalidPendingEmail() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.EMAIL_VERIFICATION,
                null,
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenService.validateToken(
                "validToken",
                TokenType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(token));

        String result = controller.verifyEmail("validToken", model);

        assertEquals("users/result", result);

        verify(model).addAttribute(
                "message",
                "Invalid email verification request."
        );

        verifyNoInteractions(userRepository);
        verify(tokenService, never()).markUsed(any());
    }

    @Test
    void testRequestVerification() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        when(userRepository.findByEmailIgnoreCase("billy@example.com"))
                .thenReturn(Optional.empty());

        when(tokenService.createToken(
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com"
        )).thenReturn("newToken");

        String result = controller.requestEmailVerification(
                "billy@example.com",
                null,
                session,
                model
        );

        assertNotNull(result);

        verify(tokenService).createToken(
                u1,
                TokenType.EMAIL_VERIFICATION,
                "billy@example.com"
        );

        verify(emailService).sendVerificationEmail(
                "billy@example.com",
                "http://localhost:8080/verify-email?token=newToken"
        );
    }

    @Test
    void testUnauthorizedVerificationRequest() {
        MockHttpSession session = new MockHttpSession();

        String result = controller.requestEmailVerification(
                "billy@example.com",
                null,
                session,
                model
        );

        assertEquals("redirect:/userlogin", result);

        verifyNoInteractions(userRepository);
        verifyNoInteractions(tokenRepository);
        verifyNoInteractions(tokenService);
        verifyNoInteractions(emailService);
    }

    @Test
    void testAccountNotFound() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.empty());

        String result = controller.requestEmailVerification(
                "billy@example.com",
                null,
                session,
                model
        );

        assertEquals("redirect:/userlogin", result);

        verify(userRepository).findById(1);
        verifyNoInteractions(tokenRepository);
        verifyNoInteractions(tokenService);
        verifyNoInteractions(emailService);
    }

    @Test
    void testIncorrectPassword() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);
        u1.setEmail("old@example.com");

        u1.setPassword(
                new BCryptPasswordEncoder().encode("correctPassword")
        );

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.requestEmailVerification(
                "new@example.com",
                "wrongPassword",
                session,
                model
        );

        assertEquals("roles/settings", result);
        assertEquals("old@example.com", u1.getEmail());

        verify(tokenService, never()).createToken(
                any(), any(), any()
        );

        verifyNoInteractions(emailService);
    }

    @Test
    void testInvalidEmailRequest() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.requestEmailVerification(
                "   ",
                null,
                session,
                model
        );

        assertEquals("roles/settings", result);

        verify(tokenService, never()).createToken(
                any(), any(), any()
        );

        verifyNoInteractions(emailService);
    }
}
