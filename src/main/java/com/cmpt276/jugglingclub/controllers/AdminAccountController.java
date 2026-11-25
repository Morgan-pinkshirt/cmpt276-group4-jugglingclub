package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;
import com.cmpt276.jugglingclub.roles.Role;
import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class AdminAccountController {

    private final usersRepository userRepository;
    private final AccountTokenRepository accountTokenRepository;
    private final savesRepository savesRepository;

    public AdminAccountController(
            usersRepository userRepository,
            AccountTokenRepository accountTokenRepository,
            savesRepository savesRepository) {
        this.userRepository = userRepository;
        this.accountTokenRepository = accountTokenRepository;
        this.savesRepository = savesRepository;
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

        if (currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.SUPER_ADMIN) {
            return "redirect:/home";
        }

        List<user> accounts = userRepository.findAll(Sort.by("uid"));
        Map<Integer, List<save>> projectsByUser = new HashMap<>();

        for (user account : accounts) {
            projectsByUser.put(
                    account.getUid(),
                    savesRepository.findAllByName(account.getName())
            );
        }

        model.addAttribute("accounts", accounts);
        model.addAttribute("projectsByUser", projectsByUser);
        model.addAttribute("currentUid", currentUser.getUid());
        model.addAttribute("currentRole", currentUser.getRole());
        model.addAttribute("theme", currentUser.getTheme());

        return "roles/view-accounts";
    }

    @Transactional
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

        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            return "redirect:/home";
        }

        if (currentUser.getUid() == uid) {
            return "redirect:/admin/accounts";
        }

        user targetUser = userRepository.findById(uid).orElse(null);

        if (targetUser == null) {
            return "redirect:/admin/accounts";
        }

        boolean canDeleteMember =
                targetUser.getRole() == Role.MEMBER;

        boolean canDeleteAdmin =
                currentUser.getRole() == Role.SUPER_ADMIN
                && targetUser.getRole() == Role.ADMIN;

        if (canDeleteMember || canDeleteAdmin) {
            accountTokenRepository.deleteByAccount(targetUser);
            accountTokenRepository.flush();
            userRepository.delete(targetUser);
        }

        return "redirect:/admin/accounts";
    }
}

