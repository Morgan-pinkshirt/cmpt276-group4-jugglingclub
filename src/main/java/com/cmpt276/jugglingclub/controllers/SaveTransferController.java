package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.RoleService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

@Controller
public class SaveTransferController {

    private final savesRepository saveREPO;
    private final RoleService roleService;
    private final JsonMapper jsonMapper;

    public SaveTransferController(
            savesRepository saveREPO,
            RoleService roleService,
            JsonMapper jsonMapper) {
        this.saveREPO = saveREPO;
        this.roleService = roleService;
        this.jsonMapper = jsonMapper;
    }

    @GetMapping("/exportproject")
    public ResponseEntity<?> exportProject(
            @RequestParam("UID") int uid,
            HttpSession session) {

        if (!roleService.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in.");
        }

        user currentUser = (user) session.getAttribute("user");
        save project = saveREPO.findByUid(uid).orElse(null);

        if (currentUser == null || project == null
                || !currentUser.getName().equals(project.getName())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Project not found.");
        }

        Map<String, String> data = new LinkedHashMap<>();
        data.put("projectname", project.getProjectname());
        data.put("productType", project.getProductType());
        data.put("productColor", project.getProductColor());
        data.put("bodyColor", project.getBodyColor());
        data.put("brightness", project.getBrightness());
        data.put("saturation", project.getSaturation());
        data.put("effect", project.getEffect());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"jester-project-" + uid + ".json\"")
                .body(data);
    }

    @PostMapping("/importproject")
    public String importProject(
            @RequestParam("file") MultipartFile file,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!roleService.isLoggedIn(session)) {
            return "redirect:/home";
        }

        user currentUser = (user) session.getAttribute("user");

        if (currentUser == null) {
            return "redirect:/home";
        }

        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute(
                    "importMessage", "Please select a JSON file.");
            return "redirect:/viewsavedprojects";
        }

        try (InputStream input = file.getInputStream()) {
            save imported = jsonMapper.readValue(input, save.class);

            if (imported == null
                    || imported.getProjectname() == null
                    || imported.getProductType() == null
                    || imported.getProductColor() == null
                    || imported.getBodyColor() == null) {
                throw new IllegalArgumentException("Invalid project data.");
            }

            boolean tooLong = Stream.of(
                    imported.getProjectname(),
                    imported.getProductType(),
                    imported.getProductColor(),
                    imported.getBodyColor(),
                    imported.getBrightness(),
                    imported.getSaturation(),
                    imported.getEffect()
            ).anyMatch(value -> value != null && value.length() > 255);

            if (tooLong) {
                throw new IllegalArgumentException("Project data is too long.");
            }

            save newProject = new save(
                    currentUser.getName(),
                    imported.getProjectname(),
                    imported.getProductType(),
                    imported.getProductColor(),
                    imported.getBodyColor(),
                    imported.getBrightness(),
                    imported.getSaturation(),
                    imported.getEffect()
            );

            saveREPO.save(newProject);

            redirectAttributes.addFlashAttribute(
                    "importMessage", "Project imported successfully.");

        } catch (IOException | JacksonException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute(
                    "importMessage", "Invalid project JSON file.");
        }

        return "redirect:/viewsavedprojects";
    }
}
