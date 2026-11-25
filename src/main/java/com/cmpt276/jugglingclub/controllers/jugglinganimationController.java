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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;

import java.util.ArrayList;
import org.springframework.web.bind.annotation.RequestBody;


@Controller
public class jugglinganimationController {
    @Autowired
    savesRepository saveREPO;
    private final RoleService roleService;

    public jugglinganimationController(RoleService roleService) {
        this.roleService = roleService;
    }
    @PostMapping("/jugglinganimation")
    public String animation(@RequestParam String UID, Model model, HttpSession session) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);
    
        if (currentsave != null) {
            if (currentsave.getBrightness() == null) {
                currentsave.setBrightness("1");
            }
            if (currentsave.getSaturation() == null) {
                currentsave.setSaturation("1");
            }
            if (currentsave.getEffect() == null) {
                currentsave.setEffect("none");
            }
            model.addAttribute("currentSave", currentsave);
        }
        model.addAttribute("UID", id);
        
        return "/sim/jugglinganimation.html";
    }
    

}
