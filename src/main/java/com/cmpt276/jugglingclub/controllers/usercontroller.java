package com.cmpt276.jugglingclub.controllers;
import java.util.List;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.AccountTokenRepository;
import com.cmpt276.jugglingclub.services.Email;
import java.time.LocalDateTime;


import com.cmpt276.jugglingclub.models.user;
import org.springframework.ui.Model;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.client.RestClientException;
import com.cmpt276.jugglingclub.roles.RoleService;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;

import java.util.Random;
@Controller
public class usercontroller{
    @Autowired usersRepository userREPO;
    private final RoleService roleService;
    private final AccountTokenService tokenService;
    private final AccountTokenRepository tokenRepository;
    private final Email emailService;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public usercontroller(RoleService roleService, AccountTokenService tokenService,
                          AccountTokenRepository tokenRepository, Email emailService) {
        this.roleService = roleService;
        this.tokenService = tokenService;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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

            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            
            model.addAttribute("stinky",user);
            return "redirect:/home";
        }
    }
    
    
    @PostMapping("/userlogin")
    public String login(Model model, @RequestParam String username, @RequestParam String password , HttpServletRequest request, HttpSession session, HttpServletResponse response, @RequestParam(required = false) String guestTheme){
        
        user vailduser = userREPO.findByName(username).orElse(null);
        if(vailduser == null){
            model.addAttribute("message","username or password dont match, log in failed");
            return "users/userlogin";
        }
        if(!passwordEncoder.matches(password, vailduser.getPassword())){

            model.addAttribute("message","username or password dont match, log in failed");
            return "users/userlogin";
        }
        
       response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
        
        request.getSession(true).setAttribute("user", vailduser); 

        model.addAttribute("stinky", session.getAttribute("user")); 
       
        return "redirect:/home";
    }
    
    
    @PostMapping("/usermakeaccount")
    public String makeaccount(Model model,
                              @RequestParam String username,
                              @RequestParam String password,
                              @RequestParam(defaultValue = "") String email,
                              @RequestParam(defaultValue = "") String favcolor,
                              @RequestParam(defaultValue = "") String mothername,
                              @RequestParam(defaultValue = "") String favplace,
                              @RequestParam(defaultValue = "") String favsubject,
                              @RequestParam(defaultValue = "") String hometown,
                              @RequestParam(defaultValue = "") String favgame,
                              HttpServletRequest request,
                              HttpSession session,
                              HttpServletResponse response) {

        user vailduser = userREPO.findByName(username).orElse(null);

        if (vailduser != null) {
            
            model.addAttribute("username", username);
            model.addAttribute("email", email);
            model.addAttribute("favcolor", favcolor);
            model.addAttribute("mothername", mothername);
            model.addAttribute("favplace", favplace);
            model.addAttribute("favsubject", favsubject);
            model.addAttribute("hometown", hometown);
            model.addAttribute("favgame", favgame);

            model.addAttribute("message", "user name taken, try again");
            return "users/createaccount";
        }

        email = email.trim();

        if (!email.isBlank()) {
            if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+$")) {
                model.addAttribute("emailError", "Please enter a valid email address.");
                model.addAttribute("username", username);
                model.addAttribute("email", email);
                model.addAttribute("favcolor", favcolor);
                model.addAttribute("mothername", mothername);
                model.addAttribute("favplace", favplace);
                model.addAttribute("favsubject", favsubject);
                model.addAttribute("hometown", hometown);
                model.addAttribute("favgame", favgame);
                return "users/createaccount";
            }
            boolean emailUsed = userREPO.findByEmailIgnoreCase(email).isPresent();
            if (emailUsed) {
                model.addAttribute("emailError", "This email address is already in use.");
                model.addAttribute("username", username);
                model.addAttribute("email", email);
                model.addAttribute("favcolor", favcolor);
                model.addAttribute("mothername", mothername);
                model.addAttribute("favplace", favplace);
                model.addAttribute("favsubject", favsubject);
                model.addAttribute("hometown", hometown);
                model.addAttribute("favgame", favgame);
                return "users/createaccount";
            }
        }

        final String hashedPassword = passwordEncoder.encode(password);
        user auser = new user(username, hashedPassword);
        auser.setTheme("purple");
        auser.setGuideOnboardingPending(true);
        auser.setFavcolor(favcolor.trim());
        auser.setMothername(mothername.trim());
        auser.setFavplace(favplace.trim());
        auser.setFavsubject(favsubject.trim());
        auser.setHometown(hometown.trim());
        auser.setFavgame(favgame.trim());
        userREPO.save(auser);

        if (!email.isBlank()) {
            String token = tokenService.createToken(
                    auser, TokenType.EMAIL_VERIFICATION, email);
            String verificationLink = baseUrl + "/verify-email?token=" + token;
            try {
                emailService.sendVerificationEmail(email, verificationLink);
            } catch (RestClientException e) {
                tokenService.validateToken(token, TokenType.EMAIL_VERIFICATION)
                        .ifPresent(tokenService::markUsed);
                response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                response.setHeader("Pragma", "no-cache");
                response.setHeader("Expires", "0");
                session.invalidate();
                model.addAttribute("message",
                        "Your account was created, but the verification email could not be sent. "
                        + "Please log in and try adding your email again in Settings.");
                return "users/result";
            }
        }

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

        request.getSession().invalidate();
        return "redirect:/home";
    }



    @PostMapping("/answersecure")
    public String getMethodName(Model model, HttpServletRequest request, HttpServletResponse response, @RequestParam String username, HttpSession session) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        session.invalidate();
        HttpSession recoverySession = request.getSession(true);
        user vailduser = userREPO.findByName(username).orElse(null);
        String chosen;
        String message;
        Random rand = new Random();
        if(vailduser == null){
            model.addAttribute("message","account dont exist");
            return "users/result";
        }

        String[] answers = {
            vailduser.getFavcolor(), vailduser.getMothername(),
            vailduser.getFavplace(), vailduser.getFavsubject(),
            vailduser.getHometown(), vailduser.getFavgame()
        };
        List<Integer> availableQuestions = new java.util.ArrayList<>();
        for (int i = 0; i < answers.length; i++) {
            if (answers[i] != null && !answers[i].isBlank()) {
                availableQuestions.add(i);
            }
        }
        if (availableQuestions.isEmpty()) {
            model.addAttribute("message", "account did not set up questions");
            return "users/result";
        }
        int random = availableQuestions.get(rand.nextInt(availableQuestions.size()));
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
        recoverySession.setAttribute("recoveryUid", vailduser.getUid());
        recoverySession.setAttribute("recoveryQuestion", chosen);
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

        Object recoveryUid = session.getAttribute("recoveryUid");
        String recoveryQuestion = (String) session.getAttribute("recoveryQuestion");
        session.removeAttribute("recoveryUid");
        session.removeAttribute("recoveryQuestion");
        if (!(recoveryUid instanceof Integer)
                || ((Integer) recoveryUid) != vailduser.getUid()
                || !question.equals(recoveryQuestion)) {
            model.addAttribute("message", "Security question session expired or invalid.");
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
                break;
            case "favsubject":
                if(answer.equalsIgnoreCase(vailduser.getFavsubject())){
                    correct = true;
                }
                break;
            case "mothername":
                if(answer.equalsIgnoreCase(vailduser.getMothername())){
                    correct = true;
                }
                break;
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
        String token = tokenService.createToken(vailduser, TokenType.PASSWORD_RESET, null);
        return "redirect:/reset-password?token=" + token;
    }

}