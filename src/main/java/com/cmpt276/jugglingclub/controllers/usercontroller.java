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


    @PostMapping("/checkquestions")
    public String checkquestions(@RequestParam String question, @RequestParam String answer, @RequestParam String username,HttpSession session, Model model) {
         if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";

    }
        user User = (user) session.getAttribute("user");  

        user vailduser = userREPO.findByName(User.getName()).orElse(null);

        if((vailduser == null)){
            model.addAttribute("message","ERROR: something went wrong, account not find");
            session.invalidate();
            return "users/result";
        }
        //TODO make a switch case based on the value of question, then match the answer

        
        return "redirect:/home";
    }
    
    
    
    
}