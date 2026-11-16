package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.controllers.AdminAccountController;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.Role;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.ui.Model;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminAccountControllerTest {

    @Mock
    private usersRepository userRepository;

    @Mock
    private Model model;

    @InjectMocks
    private AdminAccountController controller;

    private user createUser(int uid, Role role) {
        user u1 = new user("user" + uid, "password");
        u1.setUid(uid);
        u1.setRole(role);
        return u1;
    }

    private MockHttpSession createSession(user u1) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);
        return session;
    }

    @Test
    void testGuestCannotViewAccounts() {
        MockHttpSession session = new MockHttpSession();

        String result = controller.accounts(session, model);

        assertEquals("redirect:/userlogin", result);

        verifyNoInteractions(userRepository);
        verifyNoInteractions(model);
    }

    @Test
    void testMemberCannotViewAccounts() {
        user u1 = createUser(1, Role.MEMBER);
        MockHttpSession session = createSession(u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(u1));

        String result = controller.accounts(session, model);

        assertEquals("redirect:/home", result);

        verify(userRepository, never()).findAll(any(Sort.class));
        verifyNoInteractions(model);
    }

    @Test
    void testAdminCanViewAccounts() {
        user admin = createUser(1, Role.ADMIN);
        user member = createUser(2, Role.MEMBER);

        MockHttpSession session = createSession(admin);

        List<user> accounts = List.of(admin, member);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findAll(Sort.by("uid")))
                .thenReturn(accounts);

        String result = controller.accounts(session, model);

        assertEquals("roles/view-accounts", result);

        verify(model).addAttribute("accounts", accounts);
        verify(model).addAttribute("currentUid", 1);
        verify(model).addAttribute("currentRole", Role.ADMIN);
        verify(model).addAttribute("theme", admin.getTheme());

        verify(userRepository).findAll(Sort.by("uid"));
    }

    @Test
    void testSuperAdminCanViewAccounts() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        MockHttpSession session = createSession(admin);

        List<user> accounts = List.of(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findAll(Sort.by("uid")))
                .thenReturn(accounts);

        String result = controller.accounts(session, model);

        assertEquals("roles/view-accounts", result);

        verify(model).addAttribute("accounts", accounts);
        verify(model).addAttribute("currentRole", Role.SUPER_ADMIN);

        verify(userRepository).findAll(Sort.by("uid"));
    }

    @Test
    void testMissingAccountCannotViewAccounts() {
        user u1 = createUser(1, Role.ADMIN);
        MockHttpSession session = createSession(u1);

        when(userRepository.findById(1))
                .thenReturn(Optional.empty());

        String result = controller.accounts(session, model);

        assertEquals("redirect:/userlogin", result);
        assertTrue(session.isInvalid());

        verify(userRepository, never()).findAll(any(Sort.class));
        verifyNoInteractions(model);
    }

    @Test
    void testGuestCannotDeleteAccount() {
        MockHttpSession session = new MockHttpSession();

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/userlogin", result);

        verifyNoInteractions(userRepository);
    }

    @Test
    void testMemberCannotDeleteAccount() {
        user member = createUser(1, Role.MEMBER);
        MockHttpSession session = createSession(member);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(member));

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/home", result);

        verify(userRepository, never()).delete(any());
        verify(userRepository, never()).findById(2);
    }

    @Test
    void testAdminCannotDeleteAccount() {
        user admin = createUser(1, Role.ADMIN);
        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/home", result);

        verify(userRepository, never()).delete(any());
        verify(userRepository, never()).findById(2);
    }

    @Test
    void testSuperAdminDeletesMember() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        user member = createUser(2, Role.MEMBER);

        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findById(2))
                .thenReturn(Optional.of(member));

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/admin/accounts", result);

        verify(userRepository).delete(member);
        verify(userRepository, times(1)).delete(member);
    }

    @Test
    void testSuperAdminDeletesAdmin() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        user target = createUser(2, Role.ADMIN);

        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findById(2))
                .thenReturn(Optional.of(target));

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/admin/accounts", result);

        verify(userRepository).delete(target);
    }

    @Test
    void testSuperAdminCannotDeleteSelf() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        String result = controller.deleteAccount(session, 1);

        assertEquals("redirect:/admin/accounts", result);

        verify(userRepository, never()).delete(any());
    }

    @Test
    void testSuperAdminCannotDeleteSuperAdmin() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        user target = createUser(2, Role.SUPER_ADMIN);

        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findById(2))
                .thenReturn(Optional.of(target));

        String result = controller.deleteAccount(session, 2);

        assertEquals("redirect:/admin/accounts", result);

        verify(userRepository, never()).delete(any());
    }

    @Test
    void testDeleteNonexistentAccount() {
        user admin = createUser(1, Role.SUPER_ADMIN);
        MockHttpSession session = createSession(admin);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(admin));

        when(userRepository.findById(999))
                .thenReturn(Optional.empty());

        String result = controller.deleteAccount(session, 999);

        assertEquals("redirect:/admin/accounts", result);

        verify(userRepository, never()).delete(any());
    }
}
