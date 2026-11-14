package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.controllers.SettingsController;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.RoleService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SettingsControllerTest {

    @Mock
    private usersRepository userRepository;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private SettingsController controller;

    @Test
    void testChangeTheme() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);
        u1.setTheme("purple");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.changeTheme(session, "dark");

        assertEquals("redirect:/settings", result);
        assertEquals("dark", u1.getTheme());
        assertEquals(u1, session.getAttribute("user"));

        verify(userRepository).findById(1);
        verify(userRepository).save(u1);
    }

    @Test
    void testChangeToPurple() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);
        u1.setTheme("light");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.changeTheme(session, "purple");

        assertEquals("redirect:/settings", result);
        assertEquals("purple", u1.getTheme());
        assertEquals(u1, session.getAttribute("user"));

        verify(userRepository).save(u1);
    }

    @Test
    void testInvalidTheme() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);
        u1.setTheme("purple");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        String result = controller.changeTheme(session, "green");

        assertEquals("redirect:/settings", result);
        assertEquals("purple", u1.getTheme());

        verifyNoInteractions(userRepository);
    }

    @Test
    void testChangeThemeWithoutLogin() {
        MockHttpSession session = new MockHttpSession();

        String result = controller.changeTheme(session, "dark");

        assertEquals("redirect:/userlogin", result);

        verifyNoInteractions(userRepository);
    }

    @Test
    void testChangeThemeAccountNotFound() {
        user u1 = new user("billy", "bob");
        u1.setUid(1);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.empty());

        String result = controller.changeTheme(session, "dark");

        assertEquals("redirect:/userlogin", result);
        assertTrue(session.isInvalid());

        verify(userRepository).findById(1);
        verify(userRepository, never()).save(any());
    }
}

