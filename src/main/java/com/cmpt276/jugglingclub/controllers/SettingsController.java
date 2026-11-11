
package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.RoleService;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Controller
public class SettingsController {

    private final RoleService roleService;
    private final usersRepository userRepository;
    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public SettingsController(
            usersRepository userRepository,
            RoleService roleService) {
        this.userRepository = userRepository;
        this.roleService = roleService;
    }

    @PostMapping("/settings/username")
    public String changeUsername(
            HttpSession session,
            @RequestParam String username) {

        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        username = username.trim();

        if (username.isEmpty()) {
            return "redirect:/settings";
        }

        user existingUser = userRepository
                .findByName(username)
                .orElse(null);

        if (existingUser != null &&
                existingUser.getUid() != currentUser.getUid()) {
            return "redirect:/settings";
        }

        currentUser.setName(username);
        userRepository.save(currentUser);
        session.invalidate();

        return "roles/settings-success";
    }

    @PostMapping("/settings/password")
    public String changePassword(
            HttpSession session,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {

        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        if (!passwordEncoder.matches(
                currentPassword,
                currentUser.getPassword())) {
            return "redirect:/settings";
        }

        if (newPassword.isEmpty()) {
            return "redirect:/settings";
        }

        currentUser.setPassword(
                passwordEncoder.encode(newPassword));

        userRepository.save(currentUser);
        session.invalidate();

        return "roles/settings-success";
    }

    @PostMapping("/settings/theme")
    public String changeTheme(
            HttpSession session,
            @RequestParam String theme) {

        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        if (!theme.equals("light")
                && !theme.equals("dark")
                && !theme.equals("purple")) {
            return "redirect:/settings";
        }

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        currentUser.setTheme(theme);
        userRepository.save(currentUser);

        session.setAttribute("user", currentUser);

        return "redirect:/settings";
    }

    @PostMapping("/setquestions")
    public String setQuestions(
            HttpSession session,
            Model model,
            @RequestParam String favcolor,
            @RequestParam String mothername,
            @RequestParam String favplace,
            @RequestParam String favsubject,
            @RequestParam String hometown,
            @RequestParam String favgame,
            @RequestParam String currentPassword) {

        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }

        user sessionUser = (user) session.getAttribute("user");

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            model.addAttribute(
                    "message",
                    "Account not found.");

            session.invalidate();
            return "users/result";
        }

        
        if (!passwordEncoder.matches(
                currentPassword,
                currentUser.getPassword())) {
            model.addAttribute("user", currentUser);
            model.addAttribute("error", "Incorrect password.");
            return "roles/questions";
        }

       
        if (!favcolor.isBlank()) {
            currentUser.setFavcolor(favcolor);
        }
        if (!mothername.isBlank()) {
            currentUser.setMothername(mothername);
        }
        if (!favplace.isBlank()) {
            currentUser.setFavplace(favplace);
        }
        if (!favsubject.isBlank()) {
            currentUser.setFavsubject(favsubject);
        }
        if (!hometown.isBlank()) {
            currentUser.setHometown(hometown);
        }
        if (!favgame.isBlank()) {
            currentUser.setFavgame(favgame);
        }

        userRepository.save(currentUser);

        session.setAttribute("user", currentUser);
        session.setAttribute(
                "message",
                "Security questions updated.");

        return "redirect:/home";
    }

    @GetMapping("/securityquestions")
    public String securityQuestions(
            Model model,
            HttpSession session) {

        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }

        user sessionUser = (user) session.getAttribute("user");

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        model.addAttribute("user", currentUser);

        return "roles/questions";
    }
}




