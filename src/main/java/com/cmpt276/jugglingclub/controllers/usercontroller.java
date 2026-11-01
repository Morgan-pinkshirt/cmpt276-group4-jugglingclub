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


@Controller
public class usercontroller{
    @Autowired usersRepository userREPO;

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
        return "users/userlogin";
    }
    @GetMapping("/createaccount")
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
            return "users/userpage";
        }
    }
    
    
    @PostMapping("/userlogin")// tihs should make username a real vairble trust =D
    public String login(Model model, @RequestParam String username, @RequestParam String password , HttpServletRequest request, HttpSession session, HttpServletResponse response){
        
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
        request.getSession(true).setAttribute("user", vailduser); 

        model.addAttribute("stinky", session.getAttribute("user")); 
       
        return "users/userpage";
    }
    @GetMapping("usermakeacount")
    public String usermakeacount() {
        return "/users/createaccount";
    }
    
    @PostMapping("/usermakeaccount")// this should work trust.
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
        request.getSession(true).setAttribute("user", vailduser); 

        request.getSession(true).setAttribute("user", vailduser); 
        model.addAttribute("stinky", auser);

        //do stuff with session here
        return "users/userpage";//this send you to user page.
    }
    @GetMapping("/logout")
    public String getMethodName(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        
        // destroy the session
        request.getSession().invalidate();
        return "/users/userlogin";
    }
    
}