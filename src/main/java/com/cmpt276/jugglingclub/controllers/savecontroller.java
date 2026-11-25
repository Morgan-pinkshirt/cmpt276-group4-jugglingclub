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

@Controller
public class savecontroller { // this only deals with ids and stuff
    @Autowired
    savesRepository saveREPO;
    private final RoleService roleService;

    public savecontroller(RoleService roleService) {
        this.roleService = roleService;
    }

    // Also supports GET so we can redirect back to the edit page after saving
    @GetMapping("/customsave")
    public String loaddataGet(@RequestParam String UID, Model model, HttpSession session) {
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
        return "sim/view"; // The .html extension is omitted because Thymeleaf usually resolves the
                           // template name automatically
    }

    @PostMapping("/customsave")
    public String loaddataPost(@RequestParam String UID, Model model, HttpSession session) {
        return loaddataGet(UID, model, session);
    }

    // Handles POST requests from the saved projects list to edit a project in the 2D simulator
    @PostMapping("/2d-sim")
    public String editIn2D(@RequestParam String UID, Model model, HttpSession session) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);

        if (currentsave == null) {
            return "redirect:/home";
        }

        model.addAttribute("currentSave", currentsave);
        model.addAttribute("UID", id);

        // Maps to templates/2d-sim/2dsim.html
        return "2d-sim/2dsim";
    }

    @PostMapping("/savecustom")
    public String savedata(HttpSession session, Model model, @RequestParam String productType,
            @RequestParam String productColor,
            @RequestParam String bodyColor, @RequestParam String projectname, @RequestParam String brightness,
            @RequestParam String saturation, @RequestParam String effect, @RequestParam String UID,
            HttpServletRequest request) {

        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        user User = (user) session.getAttribute("user");

        if (UID.equals("new")) { // If creating a new save
            save object = new save(User.getName(), projectname, productType, productColor, bodyColor, brightness,
                    saturation, effect);
            save savedObject = saveREPO.save(object); // save() returns the saved object (including the auto-generated
                                                      // UID)

            request.getSession(false).setAttribute("message", "Your design has been saved!");

            // Keep the user on the edit page of the newly created save via the new UID
            return "redirect:/customsave?UID=" + savedObject.getUid();
        }

        // If updating an existing save
        int id = Integer.parseInt(UID);
        save existingSave = saveREPO.findByUid(id).orElse(null);

        if (existingSave != null) {
            existingSave.setProjectname(projectname);
            existingSave.setProductType(productType);
            existingSave.setProductColor(productColor);
            existingSave.setBodyColor(bodyColor);
            existingSave.setBrightness(brightness);
            existingSave.setSaturation(saturation);
            existingSave.setEffect(effect);

            saveREPO.save(existingSave);
            request.getSession(false).setAttribute("message", "Your design has been updated!");
        } else {
            request.getSession(false).setAttribute("message", "Project not found to update!");
            return "redirect:/home";
        }

        // STAY ON THE CURRENT PAGE: redirect back to the same UID instead of /home
        return "redirect:/customsave?UID=" + UID;
    }

    @GetMapping("/viewsavedprojects")
    public String viewprojects(HttpSession session, Model model) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        user User = (user) session.getAttribute("user");
        ArrayList<save> savelist = saveREPO.findAllByName(User.getName());

        model.addAttribute("projects", savelist);
        model.addAttribute("theme", User.getTheme());

        return "saves/savedproject";
    }

    @PostMapping("/deleteproject")
    public String deleteprojects(HttpSession session, HttpServletRequest request, @RequestParam String UID) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        save project = saveREPO.findById(Integer.parseInt(UID)).orElse(null);
        if (project != null) {
            saveREPO.delete(project);
            request.getSession(false).setAttribute("message", "save deleted successfully");
            // Once deleted, the project no longer exists, so we must redirect to the list
            // page or home
            return "redirect:/viewsavedprojects";
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
        model.addAttribute("projects", savelist);

        return "saves/adminsavedproject";
    }

    @PostMapping("/viewproject")
    public String viewproject(@RequestParam String UID, Model model, HttpSession session) {
        if (!roleService.isAdmin(session)) {
            return "redirect:/home";
        }
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);
        model.addAttribute("currentSave", currentsave);
        model.addAttribute("UID", UID);
        return "sim/adminview";
    }
}