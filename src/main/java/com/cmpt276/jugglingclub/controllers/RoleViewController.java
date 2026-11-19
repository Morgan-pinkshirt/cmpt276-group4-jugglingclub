package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.Role;
import com.cmpt276.jugglingclub.roles.RoleService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RoleViewController {

    private final RoleService roleService;
    private final usersRepository userRepository;

    public RoleViewController(
            RoleService roleService,
            usersRepository userRepository) {
        this.roleService = roleService;
        this.userRepository = userRepository;
    }

    @GetMapping("/home")
    public String getRole(HttpSession session, Model model, HttpServletRequest request) {
        Role role = roleService.getRole(session);
        model.addAttribute("currentRole", role);
        user currentUser = (user) session.getAttribute("user");
        model.addAttribute("message", session.getAttribute("message"));
        session.removeAttribute("message");
        model.addAttribute("theme", currentUser == null ? "light" : currentUser.getTheme());

        if (currentUser != null) {
            model.addAttribute("currentUid", currentUser.getUid());
            model.addAttribute("currentUsername", currentUser.getName());
        }

        if (role == Role.ADMIN || role == Role.SUPER_ADMIN) {
            return "roles/admin";
        } else if (role == Role.MEMBER) {
            return "roles/member";
        } else {
            return "roles/guest";
        }
    }

    @GetMapping("/settings")
    public String settings(HttpSession session, Model model) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }

        user sessionUser = (user) session.getAttribute("user");

        if (sessionUser == null) {
            return "redirect:/userlogin";
        }

        user currentUser = userRepository.findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {
            session.invalidate();
            return "redirect:/userlogin";
        }

        session.setAttribute("user", currentUser);
        model.addAttribute("user", currentUser);

        return "roles/settings";
    }

    @GetMapping("/warehouse")
    public String warehouse(HttpSession session) {
        if (!roleService.isAdmin(session)) {
            return "redirect:/home";
        }
        return "roles/warehouse";
    }

    @GetMapping("/simulator")
    public String simulator(HttpSession session, Model model) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/userlogin";
        }

        save currentsave = new save("", "", "ball", "#9f1ad3", "#ffffff", "1", "1", "none");
        model.addAttribute("UID", "new");
        model.addAttribute("productType", "ball");
        model.addAttribute("productColor", "#9f1ad3");
        model.addAttribute("bodyColor", "#ffffff");
        model.addAttribute("currentSave", currentsave);

        return "sim/view";
    }
    

        

  

    @GetMapping("/2d-sim")
    public String twoDSimulator(HttpSession session, Model model) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/userlogin";
        }
        return "2d-sim/2dsim";
    }

    @GetMapping("/under-construction")
    public String underConstruction(HttpSession session, Model model) {
        user currentUser = (user) session.getAttribute("user");
        model.addAttribute("theme", currentUser == null ? "light" : currentUser.getTheme());
        return "roles/under-construction";
    }
}
