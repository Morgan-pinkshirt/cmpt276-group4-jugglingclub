package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;

import com.cmpt276.jugglingclub.roles.RoleService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession; 



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;

import java.util.ArrayList;
@Controller 
public class savecontroller { // this only deal with ids and stuff
    @Autowired savesRepository saveREPO;
    private final RoleService roleService;

    public savecontroller(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping("/customsave")
    public String loaddata(@RequestParam String UID, Model model,HttpSession session) {

        if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";
    }   
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);

        if(currentsave.getBrightness() == null){
            currentsave.setBrightness("1");
        }
        if(currentsave.getSaturation() == null){
            currentsave.setSaturation("1");
        }
        if(currentsave.getEffect() == null){
            currentsave.setEffect("none");
        }
        model.addAttribute("currentSave", currentsave);

        model.addAttribute("UID",id);
        return "sim/view.html";
    }
    @PostMapping("/savecustom")
    public String savedata(HttpSession session, Model model, @RequestParam String productType, @RequestParam String productColor,
         @RequestParam String bodyColor,@RequestParam String projectname, @RequestParam String brightness, 
         @RequestParam String saturation, @RequestParam String effect, @RequestParam String UID, HttpServletRequest request) {
        if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";
    }   
        user User = (user) session.getAttribute("user");        
        if(UID.equals("new")){ // if UID is new, then make new save


            save object = new save(User.getName(),projectname,productType,productColor,bodyColor, brightness, saturation , effect );
            saveREPO.save(object);
            request.getSession(false).setAttribute("message", "Your design has been saved!"); 
            return "redirect:/home";
} // UID is not new, so it is from a save
    save object = new save(User.getName(),projectname,productType,productColor,bodyColor, brightness, saturation , effect);
        object.setUid(Integer.parseInt(UID)); // is this for saving
        saveREPO.save(object);
        request.getSession(false).setAttribute("message", "Your design has been updated!"); 
        
        return "redirect:/home";

        }
    @GetMapping("/viewsavedprojects")
    public String viewprojects(HttpSession session, Model model) {
        if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";
    }   
        user User = (user) session.getAttribute("user");
        ArrayList<save> savelist = saveREPO.findAllByName(User.getName());


        model.addAttribute("projects",savelist);

        return "saves/savedproject";
    }
    @PostMapping("/deleteproject")
    public String deleteprojects(HttpSession session, HttpServletRequest request, @RequestParam String UID){
         if (!roleService.isLoggedIn(session)) {
        return "redirect:/home";
        
    }   
        save project = saveREPO.findById(Integer.parseInt(UID)).orElse(null);
        if (project != null) {
            saveREPO.delete(project);

            
            request.getSession(false).setAttribute("message", "save deleted successfully"); 
            return "redirect:/home";
        }
        
        request.getSession(false).setAttribute("message", "project not found"); 
        return "redirect:/home";
    }
    
    @GetMapping("/viewallsaves")
    public String viewallsaves(Model model, HttpSession session) {
         if (!roleService.isAdmin(session)) {
        return "redirect:/home";
    }   
        ArrayList<save> savelist = saveREPO.findAll();
        model.addAttribute("projects",savelist);

        return "saves/adminsavedproject";
    }
    
    @PostMapping("/viewproject")
    public String viewproject(@RequestParam String UID,Model model, HttpSession session) {
        if (!roleService.isAdmin(session)) {
        return "redirect:/home";
    }   
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);
        model.addAttribute("currentSave", currentsave);
        model.addAttribute("UID",UID);
        return "sim/adminview";
    }
    
        
}
