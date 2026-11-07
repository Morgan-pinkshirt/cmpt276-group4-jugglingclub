package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.Role;
import com.cmpt276.jugglingclub.roles.RoleService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class RoleViewController {

    private final RoleService roleService;

    public RoleViewController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/home")
    public String getRole(HttpSession session, Model model) {
        Role role = roleService.getRole(session);
        user currentUser = (user) session.getAttribute("user");

        model.addAttribute("theme", currentUser == null ? "light" : currentUser.getTheme());

        if (roleService.isAdmin(session)) {
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

    model.addAttribute("user", session.getAttribute("user"));
    return "roles/settings";
    }

    @GetMapping("/warehouse")
    public String warehouse(HttpSession session) {
        if (!roleService.isAdmin(session)) {
            return "redirect:/home";
        }
        return "roles/warehouse";
    }

    @GetMapping("/simulator") // model
    public String simulator(HttpSession session, Model model) { // it is to convert view 
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/userlogin";
        }
        model.addAttribute("UID","new"); // this to tell save the data that current settings is not from a save
        model.addAttribute("productType","ball"); // this is the preset default values
        model.addAttribute("productColor","#9f1ad3");
        model.addAttribute("bodyColor","#ffffff");
        return "sim/view";
    }


    @GetMapping("/under-construction")
    public String underConstruction() {
        return "roles/under-construction";
    }
}
