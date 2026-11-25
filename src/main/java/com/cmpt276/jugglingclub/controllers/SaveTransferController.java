
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
        data.put("optionsJson", project.getOptionsJson());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"jester-project-" + uid + ".json\"")
                .body(data);
    }

    @GetMapping("/api/saved-products")
    public ResponseEntity<?> listSavedProducts(HttpSession session) {
        if (!roleService.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in.");
        }

        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in.");
        }

        List<Map<String, Object>> products = saveREPO.findAllByName(currentUser.getName())
                .stream()
                .map(project -> {
                    Map<String, Object> product = new LinkedHashMap<>();
                    product.put("id", project.getUid());
                    product.put("name", project.getProjectname());
                    product.put("type", project.getProductType());
                    product.put("productType", project.getProductType());
                    product.put("productColor", project.getProductColor());
                    product.put("bodyColor", project.getBodyColor());
                    product.put("brightness", project.getBrightness());
                    product.put("saturation", project.getSaturation());
                    product.put("effect", project.getEffect());
                    product.put("options", parseSavedOptions(project.getOptionsJson()));
                    return product;
                })
                .toList();

        return ResponseEntity.ok(products);
    }

    private Object parseSavedOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) return null;
        try {
            Object options = jsonMapper.readValue(optionsJson, Object.class);
            return options instanceof Map<?, ?> ? options : null;
        } catch (JacksonException e) {
            System.err.println("Failed to read saved Product options: " + e.getMessage());
            return null;
        }
    }

    @PostMapping("/api/saved-products/from-moment")
    public ResponseEntity<?> saveFromMoment(
            @RequestBody Map<String, Object> payload,
            HttpSession session) {

        if (!roleService.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in."));
        }
        user currentUser = (user) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in."));
        }

        Object nameValue = payload == null ? null : payload.get("projectName");
        Object optionsValue = payload == null ? null : payload.get("options");
        if (!(nameValue instanceof String) || !(optionsValue instanceof Map<?, ?>)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "A project name and Moment options are required."));
        }

        String projectName = ((String) nameValue).trim();
        Map<?, ?> options = (Map<?, ?>) optionsValue;
        if (projectName.isEmpty() || projectName.length() > 150 || options.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid project name or Moment options."));
        }

        String productType = Objects.toString(options.get("productType"), "").trim();
        if (!List.of("ball", "club", "staff").contains(productType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid Product type."));
        }

        String productColor = Objects.toString(options.get("productColor"), "").trim();
        if (productColor.isEmpty()) {
            String colorKey = switch (productType) {
                case "ball" -> "ballColor";
                case "staff" -> "colorKnob1";
                default -> "handleColor";
            };
            productColor = Objects.toString(options.get(colorKey), "").trim();
        }
        String bodyColor = Objects.toString(options.get("bodyColor"), "").trim();
        if (bodyColor.isEmpty() && productType.equals("staff")) {
            bodyColor = Objects.toString(options.get("colorStaff"), "").trim();
        }
        if (bodyColor.isEmpty()) bodyColor = "#ffffff";

        String brightness = Objects.toString(options.get("brightness"), "1");
        String saturation = Objects.toString(options.get("saturation"), "1");
        String effect = Objects.toString(options.get("effect"), "none");

        if (!productColor.matches("#[0-9a-fA-F]{6}")
                || !bodyColor.matches("#[0-9a-fA-F]{6}")
                || Stream.of(productType, brightness, saturation, effect)
                        .anyMatch(value -> value.length() > 255)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid Product settings."));
        }

        String optionsJson;
        try {
            optionsJson = jsonMapper.writeValueAsString(options);
        } catch (JacksonException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid Moment options."));
        }
        if (optionsJson.getBytes(StandardCharsets.UTF_8).length > 65536) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Moment options exceed the 64 KB limit."));
        }

        save product = new save(
                currentUser.getName(), projectName, productType, productColor,
                bodyColor, brightness, saturation, effect);
        product.setOptionsJson(optionsJson);
        save saved = saveREPO.save(product);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getUid(),
                "projectName", saved.getProjectname(),
                "projectType", "Product"));
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

            String optionsJson = imported.getOptionsJson();
            if (optionsJson != null) {
                if (optionsJson.getBytes(StandardCharsets.UTF_8).length > 65536) {
                    throw new IllegalArgumentException("Product options exceed the 64 KB limit.");
                }
                Object options = jsonMapper.readValue(optionsJson, Object.class);
                if (!(options instanceof Map<?, ?>)) {
                    throw new IllegalArgumentException("Invalid Product options.");
                }
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
            newProject.setOptionsJson(optionsJson);

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
