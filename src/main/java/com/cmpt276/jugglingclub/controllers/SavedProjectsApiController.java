package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.RoleService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// JSON list of the logged-in user's saved projects (used by the synchro page)
@RestController
public class SavedProjectsApiController {

    private final savesRepository saveREPO;
    private final RoleService roleService;

    public SavedProjectsApiController(savesRepository saveREPO, RoleService roleService) {
        this.saveREPO = saveREPO;
        this.roleService = roleService;
    }

    @GetMapping("/api/saved-projects")
    public ResponseEntity<?> savedProjects(HttpSession session) {
        if (!roleService.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in.");
        }
        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in.");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (save p : saveREPO.findAllByName(currentUser.getName())) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("uid", p.getUid());
            row.put("projectname", p.getProjectname());
            row.put("productType", p.getProductType());
            row.put("productColor", p.getProductColor());
            row.put("bodyColor", p.getBodyColor());
            row.put("brightness", p.getBrightness());
            row.put("saturation", p.getSaturation());
            row.put("effect", p.getEffect());
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }
}