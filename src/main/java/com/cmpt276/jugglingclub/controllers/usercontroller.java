package com.cmpt276.jugglingclub.controllers;
import java.util.List; // probability needs this lol
import com.cmpt276.jugglingclub.models.usersRepository;


import com.cmpt276.jugglingclub.models.user;
import org.springframework.ui.Model;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestBody;
import com.cmpt276.jugglingclub.roles.RoleService;

import java.util.Random;
@Controller
public class usercontroller{
    @Autowired usersRepository userREPO;
    private final RoleService roleService;

    public usercontroller(RoleService roleService) {
        this.roleService = roleService;
    }

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

// use this to check for session's existence:
    public boolean vaildator(HttpServletRequest request, HttpSession session, HttpServletResponse response){ // USE THIS TO CHECK FOR session is logged in or not
        if(session == null){
            return false;
        }
        user user = (user) session.getAttribute("user");
        if(user == null){
            return  false;
        }else{
            return true;
        }
    }
    @GetMapping("/")
    public String startup() {
        return "redirect:/home";
    }
    @GetMapping({"/createaccount", "/userregister"})
    public String getreateaccount() {
        return "users/createaccount";
    }
    
    @GetMapping("/userlogin")
    public String getlogin(Model model, HttpServletRequest request, HttpSession session, HttpServletResponse response){
        
        user user = (user) session.getAttribute("user");
        if (user == null){
            return "users/userlogin";
        }
        else {
            
            // Prevent caching
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            
            model.addAttribute("stinky",user);
            return "redirect:/home";
        }
    }
    
    
    @PostMapping("/userlogin")// tihs should make username a real vairble trust =D
    public String login(Model model, @RequestParam String username, @RequestParam String password , HttpServletRequest request, HttpSession session, HttpServletResponse response, @RequestParam(required = false) String guestTheme){
        
        user vailduser = userREPO.findByName(username).orElse(null);
        if(vailduser == null){
            model.addAttribute("message","username or password dont match, log in failed");
            return "users/result";
        }
        if(!passwordEncoder.matches(password, vailduser.getPassword())){

            model.addAttribute("message","username or password dont match, log in failed");
            return "users/result";
        }
        
       response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
        
            if ("light".equals(guestTheme)
                || "dark".equals(guestTheme)
                || "purple".equals(guestTheme)) {
        
            vailduser.setTheme(guestTheme);
            userREPO.save(vailduser);
        }

        request.getSession(true).setAttribute("user", vailduser); 

        model.addAttribute("stinky", session.getAttribute("user")); 
       
        return "redirect:/home";
    }
    
    
    @PostMapping("/usermakeaccount")
    public String makeaccount(Model model, @RequestParam String username, @RequestParam String password ,HttpServletRequest request, HttpSession session, HttpServletResponse response){ //, HttpServletRequest request, HttpSession session
       
        user vailduser = userREPO.findByName(username).orElse(null);

        if(!(vailduser == null)){
            model.addAttribute("message","user name taken, try again");
            return "users/result";
        }
        final String hashedPassword = passwordEncoder.encode(password);
        user auser = new user(username,hashedPassword); // get value
        userREPO.save(auser);
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        session.invalidate();

        return "users/registration-success";
    }

    @GetMapping("/logout")
    public String getMethodName(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        
        // destroy the session
        request.getSession().invalidate();
        return "redirect:/home";
    }



    @PostMapping("/answersecure")
    public String getMethodName(Model model, HttpServletRequest request, HttpServletResponse response, @RequestParam String username, HttpSession session) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        session.invalidate();
        user vailduser = userREPO.findByName(username).orElse(null);
        String chosen;
        String message;
        Random rand = new Random();
        int random = rand.nextInt(5);
        if(vailduser == null){
            model.addAttribute("message","account dont exist");
            return "users/result";
        }
        if(vailduser.getFavcolor() == null){
            model.addAttribute("message","account did not set up questions");
            return "users/result";
        }
        switch(random){
            case 0:
                chosen = "favcolor";
                message = "what is your favourite color?";
                break;
            case 1:
                chosen = "mothername";
                message = "what is your mother's name?";
                break;
            case 2:
                chosen = "favplace";
                message = "what is your favourite place?";
                break;
            case 3:
                chosen = "favsubject";
                message = "what is your favourite subject?";
                break;
            case 4:
                chosen = "hometown";
                message = "where are you born in?";
                break;
            case 5:
                chosen = "favgame";
                message = "what is your favourite game?";
                break;
            default:
                model.addAttribute("message","ERROR OCCURED!!!!!!");
                return "users/result";
        }
        model.addAttribute("message", message);        
        model.addAttribute("username", vailduser.getName());
        model.addAttribute("question", chosen);

        return "users/recoverpassword";
    }
    
    @PostMapping("/secureanswer")
    public String checkanswer(@RequestParam String answer, @RequestParam String question, Model model, HttpServletRequest request, HttpServletResponse response,HttpSession session, @RequestParam String username) {
        user vailduser = userREPO.findByName(username).orElse(null);
        Boolean correct = false;
        if(vailduser == null){
            model.addAttribute("message","account dont exist");
            return "users/result";
        }
        
        switch (question) {
            case "favcolor":
                if(answer.equalsIgnoreCase(vailduser.getFavcolor())){
                    correct = true;
                }
                break;
            case "favgame":
                if(answer.equalsIgnoreCase(vailduser.getFavgame())){
                    correct = true;
                }
                break;
            case "favplace":
                if(answer.equalsIgnoreCase(vailduser.getFavplace())){
                    correct = true;
                }
            case "favsubject":
                if(answer.equalsIgnoreCase(vailduser.getFavsubject())){
                    correct = true;
                }
            case "mothername":
                if(answer.equalsIgnoreCase(vailduser.getMothername())){
                    correct = true;
                }
            case "hometown":
                if(answer.equalsIgnoreCase(vailduser.getHometown())){
                    correct = true;
                }

                break;

            default:
                break;

        }
        if(!correct){
            model.addAttribute("message","WRONG ANswer");
            return "users/result";
        }

        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        vailduser.setPassword(passwordEncoder.encode("12345"));
        userREPO.save(vailduser);
        request.getSession(true).setAttribute("user", vailduser); 
        model.addAttribute("stinky", session.getAttribute("user")); 
        request.getSession(false).setAttribute("message", "your password is now 12345, please change it in settings"); 
        return "redirect:/home";
    }

}