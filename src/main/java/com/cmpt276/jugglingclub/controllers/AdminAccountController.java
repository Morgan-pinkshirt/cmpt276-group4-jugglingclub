package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.Role;
import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AdminAccountController {

    private final usersRepository userRepository;

    public AdminAccountController(usersRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/admin/accounts")
    public String accounts(HttpSession session, Model model) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        session.setAttribute("user", currentUser);

        if (currentUser.getRole() != Role.ADMIN) {
            return "redirect:/home";
        }

        model.addAttribute("accounts", userRepository.findAll(Sort.by("uid")));
        model.addAttribute("currentUid", currentUser.getUid());
        model.addAttribute("theme", currentUser.getTheme());

        return "roles/view-accounts";
    }

    @PostMapping("/admin/accounts/delete")
    public String deleteAccount(HttpSession session, @RequestParam int uid) {
        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid()).orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        if (currentUser.getRole() != Role.ADMIN) {
            return "redirect:/home";
        }

        if (currentUser.getUid() == uid) {
            return "redirect:/admin/accounts";
        }

        user targetUser = userRepository.findById(uid).orElse(null);

        if (targetUser != null) {
            userRepository.delete(targetUser);
        }

        return "redirect:/admin/accounts";
    }
}

