
package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.RoleService;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Controller
public class SettingsController {
    private final RoleService roleService;
    private final usersRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public SettingsController(usersRepository userRepository, RoleService roleService) {
        this.userRepository = userRepository;
        this.roleService = roleService;
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

        if (!theme.equals("light") && !theme.equals("dark")) {
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
        
    @PostMapping("/setEmail")
    public String setemail(@RequestParam String email, HttpSession session, HttpServletRequest request, Model model) {
        //TODO: process POST request
         if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";

    }
        user User = (user) session.getAttribute("user");  

        user vailduser = userRepository.findByName(User.getName()).orElse(null);

        if((vailduser == null)){
            model.addAttribute("message","ERROR: something went wrong, account not find");
            session.invalidate();
            return "users/result";
        }

        user emailcheck = userRepository.findByEmail(email).orElse(null);
        if(emailcheck == null){
            vailduser.setEmail(email);
            userRepository.save(vailduser);
            request.getSession(false).setAttribute("user",vailduser);
            request.getSession(false).setAttribute("message","Email saved");
            return "redirect:/home";
        }
        request.getSession(false).setAttribute("message","Email already linked");
        return "redirect:/home";
    }

    @PostMapping("/setquestions") //NOTE: ALL FIELD MUST BE FILLED ON HTML FOR THIS TO RUN!!!!
    public String setquestions(HttpSession session, Model model, @RequestParam String favcolor,
    @RequestParam String mothername,
    @RequestParam String favplace,
    @RequestParam String favsubject,
    @RequestParam String hometown,
    @RequestParam String favgame,
    HttpServletRequest request ) {
         if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";

    }
        user User = (user) session.getAttribute("user");  

        user vailduser = userRepository.findByName(User.getName()).orElse(null);

        if((vailduser == null)){
            model.addAttribute("message","ERROR: something went wrong, account not find");
            session.invalidate();
            return "users/result";
        }
        vailduser.setFavcolor(favcolor);
        vailduser.setMothername(mothername);
        vailduser.setFavplace(favplace);
        vailduser.setFavsubject(favsubject);
        vailduser.setHometown(hometown);
        vailduser.setFavgame(favgame);
        userRepository.save(vailduser); // saving the new info
        request.getSession(false).setAttribute("message","questions answer updated");
        return "redirect:/home";
    }
    @GetMapping("/securityquestions")
    public String securityquestions(Model model, HttpSession session) {
         if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";

    }
        user User = (user) session.getAttribute("user");  

        user vailduser = userRepository.findByName(User.getName()).orElse(null);

        if((vailduser == null)){
            model.addAttribute("message","ERROR: something went wrong, account not find");
            session.invalidate();
            return "users/result";
        }
        model.addAttribute("user", vailduser);
        return "roles/questions";
    }

    

}



