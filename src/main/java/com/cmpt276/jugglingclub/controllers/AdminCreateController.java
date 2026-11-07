package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.Role;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Controller
public class AdminCreateController {

    private final usersRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminCreateController(usersRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/admin/create")
    public String createAdminPage(HttpSession session, Model model) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
        return "redirect:/home";
    }

        return "roles/create-admin";
    }

    @PostMapping("/admin/create")
    public String createAdmin(HttpSession session, Model model, @RequestParam String username, @RequestParam String password) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
            return "redirect:/home";
        }

        username = username.trim();

        if (username.isEmpty() || password.isBlank()) {
            model.addAttribute("message", "Username and password are required.");
            return "roles/create-admin";
        }

        if (userRepository.findByName(username).isPresent()) {
            model.addAttribute("message", "Username already exists.");
            return "roles/create-admin";
        }

        user newAdmin = new user(username, passwordEncoder.encode(password));
        newAdmin.setRole(Role.ADMIN);
        userRepository.save(newAdmin);

        return "redirect:/home";
    }
}
