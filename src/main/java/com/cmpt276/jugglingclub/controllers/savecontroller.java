package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.dto.SavedProjectItem;
import com.cmpt276.jugglingclub.models.SynchroProject;
import com.cmpt276.jugglingclub.models.SynchroProjectRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
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
import java.util.Comparator;
import java.util.List;

@Controller
public class savecontroller { // this only deals with ids and stuff
    @Autowired
    savesRepository saveREPO;

    @Autowired
    SynchroProjectRepository synchroProjectRepository;

    @Autowired
    usersRepository userREPO;

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
        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null) {
            return "redirect:/home";
        }
        if ("new".equals(UID)) {
            save newProduct = new save(currentUser.getName(), "", "club", "#ff5733", "#ffffff",
                    "1", "1", "none");
            model.addAttribute("currentSave", newProduct);
            model.addAttribute("UID", "new");
            return "sim/view";
        }

        int id;
        try {
            id = Integer.parseInt(UID);
        } catch (NumberFormatException e) {
            return "redirect:/viewsavedprojects";
        }
        save currentsave = saveREPO.findByUid(id).orElse(null);
        if (currentsave == null || !currentUser.getName().equals(currentsave.getName())) {
            return "redirect:/viewsavedprojects";
        }
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

        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null || currentsave == null
                || !currentUser.getName().equals(currentsave.getName())) {
            return "redirect:/viewsavedprojects";
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
            @RequestParam(name = "optionsJson", required = false) String optionsJson,
            HttpServletRequest request) {

        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        user User = (user) session.getAttribute("user");
        if (User == null) {
            return "redirect:/home";
        }

        if (UID.equals("new")) { // If creating a new save
            save object = new save(User.getName(), projectname, productType, productColor, bodyColor, brightness,
                    saturation, effect);
            if (optionsJson != null && !optionsJson.isBlank()) {
                object.setOptionsJson(optionsJson);
            }
            save savedObject = saveREPO.save(object); // save() returns the saved object (including the auto-generated
                                                      // UID)

            request.getSession(false).setAttribute("message", "Your design has been saved!");

            // Keep the user on the edit page of the newly created save via the new UID
            return "redirect:/customsave?UID=" + savedObject.getUid();
        }

        // If updating an existing save
        int id;
        try {
            id = Integer.parseInt(UID);
        } catch (NumberFormatException e) {
            return "redirect:/viewsavedprojects";
        }
        save existingSave = saveREPO.findByUid(id).orElse(null);

        if (existingSave != null && User.getName().equals(existingSave.getName())) {
            existingSave.setProjectname(projectname);
            existingSave.setProductType(productType);
            existingSave.setProductColor(productColor);
            existingSave.setBodyColor(bodyColor);
            existingSave.setBrightness(brightness);
            existingSave.setSaturation(saturation);
            existingSave.setEffect(effect);
            if (optionsJson != null && !optionsJson.isBlank()) {
                existingSave.setOptionsJson(optionsJson);
            }

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
    public String viewprojects(HttpSession session, Model model,
            @RequestParam(name = "sort", defaultValue = "newest") String sort) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        user User = (user) session.getAttribute("user");
        ArrayList<save> savelist = saveREPO.findAllByName(User.getName());
        List<SynchroProject> synchroProjects = synchroProjectRepository
                .findAllByOwnerUidOrderByCreatedAtDesc(User.getUid());

        List<SavedProjectItem> projectItems = new ArrayList<>();
        for (save product : savelist) {
            projectItems.add(SavedProjectItem.fromProduct(product, product.getCreatedAt()));
        }
        for (SynchroProject project : synchroProjects) {
            projectItems.add(SavedProjectItem.fromSynchro(project, User.getName()));
        }

        String selectedSort = normalizeSort(sort);
        sortProjectItems(projectItems, selectedSort);

        model.addAttribute("projects", savelist);
        model.addAttribute("projectItems", projectItems);
        model.addAttribute("selectedSort", selectedSort);
        model.addAttribute("theme", User.getTheme());

        return "saves/savedproject";
    }

    private String normalizeSort(String sort) {
        return switch (sort) {
            case "oldest", "productFirst", "synchroFirst" -> sort;
            default -> "newest";
        };
    }

    private void sortProjectItems(List<SavedProjectItem> projectItems, String sort) {
        Comparator<SavedProjectItem> byName = Comparator.comparing(
                SavedProjectItem::getProjectName,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
        Comparator<SavedProjectItem> byId = Comparator.comparingLong(SavedProjectItem::getId);
        Comparator<SavedProjectItem> oldestFirst = Comparator.comparing(
                SavedProjectItem::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder()));
        Comparator<SavedProjectItem> newestFirst = Comparator.comparing(
                SavedProjectItem::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder()));
        Comparator<SavedProjectItem> productFirst = Comparator.comparingInt(
                item -> item.isProduct() ? 0 : 1);
        Comparator<SavedProjectItem> synchroFirst = Comparator.comparingInt(
                item -> item.isSynchro() ? 0 : 1);

        Comparator<SavedProjectItem> order = switch (sort) {
            case "oldest" -> oldestFirst.thenComparing(byName).thenComparing(byId);
            case "productFirst" -> productFirst.thenComparing(byName).thenComparing(byId);
            case "synchroFirst" -> synchroFirst.thenComparing(byName).thenComparing(byId);
            default -> newestFirst.thenComparing(byName).thenComparing(byId);
        };
        projectItems.sort(order);
    }

    @PostMapping("/deleteproject")
    public String deleteprojects(HttpSession session, HttpServletRequest request, @RequestParam String UID) {
        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }
        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null) {
            return "redirect:/home";
        }
        int id;
        try {
            id = Integer.parseInt(UID);
        } catch (NumberFormatException e) {
            return "redirect:/viewsavedprojects";
        }
        save project = saveREPO.findById(id).orElse(null);
        if (project != null && currentUser.getName().equals(project.getName())) {
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
        List<SynchroProject> synchroProjects = synchroProjectRepository.findAll();
        List<SavedProjectItem> projectItems = new ArrayList<>();
        for (save product : savelist) {
            projectItems.add(SavedProjectItem.fromProduct(product, product.getCreatedAt()));
        }
        for (SynchroProject project : synchroProjects) {
            String ownerName = userREPO.findById(project.getOwnerUid())
                    .map(user::getName).orElse("Unknown user");
            projectItems.add(SavedProjectItem.fromSynchro(project, ownerName));
        }

        model.addAttribute("projects", savelist);
        model.addAttribute("projectItems", projectItems);
        user currentUser = (user) session.getAttribute("user");
        model.addAttribute("theme", currentUser.getTheme());

        return "saves/adminsavedproject";
    }

    @PostMapping("/viewproject")
    public String viewproject(@RequestParam String UID, Model model, HttpSession session) {
        if (!roleService.isAdmin(session)) {
            return "redirect:/home";
        }
        int id = Integer.parseInt(UID);
        save currentsave = saveREPO.findByUid(id).orElse(null);
        if (currentsave == null) {
            return "redirect:/viewallsaves";
        }
        model.addAttribute("currentSave", currentsave);
        model.addAttribute("UID", UID);
        return "sim/adminview";
    }
}