
package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Controller
public class SettingsController {

    private final usersRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public SettingsController(usersRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/settings/username")
    public String changeUsername(HttpSession session, @RequestParam String username) {
        user currentUser = (user) session.getAttribute("user");

        if (currentUser == null) {
            return "redirect:/userlogin";
        }

        username = username.trim();

        if (username.isEmpty()) {
            return "redirect:/settings";
        }

        user existingUser = userRepository.findByName(username).orElse(null);

        if (existingUser != null && existingUser.getUid() != currentUser.getUid()) {
            return "redirect:/settings";
        }

        currentUser.setName(username);
        userRepository.save(currentUser);
        session.invalidate();

        return "roles/settings-success";
    }

    @PostMapping("/settings/password")
    public String changePassword(HttpSession session, @RequestParam String currentPassword, @RequestParam String newPassword) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        if (!passwordEncoder.matches(currentPassword, currentUser.getPassword()) || newPassword.isEmpty()) {
            return "redirect:/settings";
        }

        currentUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(currentUser);
        session.invalidate();

        return "roles/settings-success";
    }

    @PostMapping("/settings/theme")
    public String changeTheme(HttpSession session, @RequestParam String theme) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        if (!theme.equals("light") && !theme.equals("dark") && !theme.equals("purple")) {
            return "redirect:/settings";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        currentUser.setTheme(theme);
        userRepository.save(currentUser);
        session.setAttribute("user", currentUser);

        return "redirect:/settings";
    }

}



