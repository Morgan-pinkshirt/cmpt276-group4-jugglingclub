package com.cmpt276.jugglingclub.controllers;
import java.util.List; // probability needs this lol
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.user;
import org.springframework.ui.Model;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;


@Controller
public class usercontroller{
    @Autowired usersRepository userREPO;
    @PostMapping("/userlogin/{username}")// tihs should make username a real vairble trust =D
    public String login(Model model, @RequestParam String username, @RequestParam String password){
        
        user vailduser = userREPO.findByName(username).orElse(null);
        if(vailduser == null){
            model.addAttribute("message","username or password dont match, log in failed");
            return "users/result";
        }
        if(!vailduser.getPassword().equals(password)){

            model.addAttribute("message","username or password dont match, log in failed");
            return "users/result";
        }
        
        model.addAttribute("stinky", vailduser);

        return "users/userpage";
    }

    @PostMapping("/usermakeaccount/{username}")// this should work trust.
    public String makeaccount(Model model, @RequestParam String username, @RequestParam String password){
       
        user vailduser = userREPO.findByName(username).orElse(null);

        if(!(vailduser == null)){
            model.addAttribute("message","user name taken, try again");
            return "users/result";
        }
        user auser = new user(username,password); // get value
        userREPO.save(auser);

        model.addAttribute("stinky", auser);

        return "users/userpage";//this send you to user page.
    }

}