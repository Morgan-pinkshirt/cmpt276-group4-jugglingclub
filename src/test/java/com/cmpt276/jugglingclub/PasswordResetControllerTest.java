package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.controllers.PasswordResetController;
import com.cmpt276.jugglingclub.models.AccountToken;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import com.cmpt276.jugglingclub.services.Email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.ui.Model;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PasswordResetControllerTest {

    @Mock
    private usersRepository userRepository;

    @Mock
    private AccountTokenService tokenService;

    @Mock
    private Email emailService;

    @Mock
    private Model model;

    @InjectMocks
    private PasswordResetController controller;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                controller,
                "baseUrl",
                "http://localhost:8080"
        );
    }

    @Test
    void testForgotPasswordPage() {
        String result = controller.forgotPassword();

        assertEquals("users/forgot-password", result);
    }

    @Test
    void testRequestPasswordReset() {
        user u1 = new user("billy", "bob");
        u1.setEmail("billy@example.com");
        u1.setEmailVerified(true);

        when(userRepository.findByEmailIgnoreCase("billy@example.com"))
                .thenReturn(Optional.of(u1));

        when(tokenService.createToken(
                u1,
                TokenType.PASSWORD_RESET,
                null
        )).thenReturn("newToken");

        String result = controller.requestPasswordReset(
                "billy@example.com",
                model
        );

        assertEquals("users/result", result);

        verify(userRepository).findByEmailIgnoreCase(
                "billy@example.com"
        );

        verify(tokenService).createToken(
                u1,
                TokenType.PASSWORD_RESET,
                null
        );

        verify(emailService).sendPasswordResetEmail(
                "billy@example.com",
                "http://localhost:8080/reset-password?token=newToken"
        );

        verify(model).addAttribute(
                "message",
                "If this email is registered and verified, "
                + "a password reset link will be sent."
        );
    }

    @Test
    void testUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com"))
                .thenReturn(Optional.empty());

        String result = controller.requestPasswordReset(
                "unknown@example.com",
                model
        );

        assertEquals("users/forgot-password", result);

        verify(userRepository).findByEmailIgnoreCase(
                "unknown@example.com"
        );

        verify(model).addAttribute(
                "emailError",
                "No account is associated with this email address."
        );

        verify(model).addAttribute(
                "email",
                "unknown@example.com"
        );

        verifyNoInteractions(tokenService);
        verifyNoInteractions(emailService);
    }

    @Test
    void testUnverifiedEmail() {
        user u1 = new user("billy", "bob");
        u1.setEmail("billy@example.com");
        u1.setEmailVerified(false);

        when(userRepository.findByEmailIgnoreCase("billy@example.com"))
                .thenReturn(Optional.of(u1));

        String result = controller.requestPasswordReset(
                "billy@example.com",
                model
        );

        assertEquals("users/forgot-password", result);

        verify(userRepository).findByEmailIgnoreCase(
                "billy@example.com"
        );

        verify(model).addAttribute(
                "emailError",
                "No account is associated with this email address."
        );

        verify(model).addAttribute(
                "email",
                "billy@example.com"
        );

        verifyNoInteractions(tokenService);
        verifyNoInteractions(emailService);
    }

    @Test
    void testBlankEmail() {
        String result = controller.requestPasswordReset(
                "   ",
                model
        );

        assertEquals("users/forgot-password", result);

        verify(model).addAttribute(
                "emailError",
                "Please enter an email address."
        );

        verifyNoInteractions(userRepository);
        verifyNoInteractions(tokenService);
        verifyNoInteractions(emailService);
    }

    @Test
    void testShowResetPassword() {
        user u1 = new user("billy", "bob");

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.PASSWORD_RESET,
                null,
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenService.validateToken(
                "validToken",
                TokenType.PASSWORD_RESET
        )).thenReturn(Optional.of(token));

        String result = controller.showResetPassword(
                "validToken",
                model
        );

        assertEquals("users/reset-password", result);

        verify(model).addAttribute(
                "token",
                "validToken"
        );

        verify(tokenService).validateToken(
                "validToken",
                TokenType.PASSWORD_RESET
        );
    }

    @Test
    void testInvalidResetLink() {
        when(tokenService.validateToken(
                "invalidToken",
                TokenType.PASSWORD_RESET
        )).thenReturn(Optional.empty());

        String result = controller.showResetPassword(
                "invalidToken",
                model
        );

        assertEquals("users/result", result);

        verify(model).addAttribute(
                "message",
                "Invalid or expired password reset link."
        );

        verify(tokenService).validateToken(
                "invalidToken",
                TokenType.PASSWORD_RESET
        );
    }

    @Test
    void testResetPassword() {
        user u1 = new user("billy", "oldPassword");
        u1.setUid(1);

        AccountToken token = new AccountToken(
                "tokenHash",
                u1,
                TokenType.PASSWORD_RESET,
                null,
                LocalDateTime.now().plusMinutes(30)
        );

        when(tokenService.validateToken(
                "validToken",
                TokenType.PASSWORD_RESET
        )).thenReturn(Optional.of(token));

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.resetPassword(
                "validToken",
                "newPassword",
                "newPassword",
                model
        );

        assertEquals("users/result", result);

        assertTrue(
                new BCryptPasswordEncoder().matches(
                        "newPassword",
                        u1.getPassword()
                )
        );

        assertNotEquals(
                "newPassword",
                u1.getPassword()
        );

        verify(tokenService).validateToken(
                "validToken",
                TokenType.PASSWORD_RESET
        );

        verify(userRepository).findById(1);
        verify(userRepository).saveAndFlush(u1);

        verify(tokenService).markUsed(token);

        verify(model).addAttribute(
                "message",
                "Your password has been reset successfully."
        );
    }

    @Test
    void testPasswordMismatch() {
        String result = controller.resetPassword(
                "validToken",
                "password1",
                "password2",
                model
        );

        assertEquals("users/reset-error", result);

        verify(model).addAttribute(
                "message",
                "Passwords do not match."
        );

        verify(model).addAttribute(
                "token",
                "validToken"
        );

        verifyNoInteractions(tokenService);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(emailService);
    }

    @Test
    void testInvalidResetToken() {
        when(tokenService.validateToken(
                "invalidToken",
                TokenType.PASSWORD_RESET
        )).thenReturn(Optional.empty());

        String result = controller.resetPassword(
                "invalidToken",
                "newPassword",
                "newPassword",
                model
        );

        assertEquals("users/result", result);

        verify(model).addAttribute(
                "message",
                "Invalid or expired password reset link."
        );

        verify(tokenService).validateToken(
                "invalidToken",
                TokenType.PASSWORD_RESET
        );

        verify(userRepository, never()).saveAndFlush(any());
        verify(tokenService, never()).markUsed(any());
        verifyNoInteractions(emailService);
    }
}
