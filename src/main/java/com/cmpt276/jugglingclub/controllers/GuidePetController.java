package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.roles.Role;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/guide-pet")
public class GuidePetController {

    private final usersRepository userRepository;

    public GuidePetController(usersRepository userRepository) {
        this.userRepository = userRepository;
    }

    
    private user getCurrentUser(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object sessionValue = session.getAttribute("user");

        if (!(sessionValue instanceof user)) {
            return null;
        }

        user sessionUser = (user) sessionValue;

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {

            session.invalidate();

            return null;
        }

        return currentUser;
    }

   
    private String getTheme(user currentUser) {

        if (currentUser == null) {
            return "light";
        }

        String theme = currentUser.getTheme();

        if ("light".equals(theme)
                || "dark".equals(theme)
                || "purple".equals(theme)) {

            return theme;
        }

        return "purple";
    }

    // Return the assistant configuration for the current account.
    @GetMapping(
            value = "/status",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> getStatus(
            HttpServletRequest request) {

        user currentUser = getCurrentUser(request);

        Role role = currentUser == null
                ? Role.GUEST
                : currentUser.getRole();

        boolean enabled =
                role == Role.GUEST
                || role == Role.MEMBER;

        boolean onboardingPending =
                role == Role.MEMBER
                && currentUser != null
                && currentUser.isGuideOnboardingPending();

        String theme = role == Role.GUEST
                ? "light"
                : getTheme(currentUser);

        Map<String, Object> response = Map.of(
                "role", role.name(),
                "theme", theme,
                "enabled", enabled,
                "onboardingPending", onboardingPending
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    
    @PostMapping(
            value = "/onboarding/complete",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> completeOnboarding(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {

        user currentUser = getCurrentUser(request);

        if (currentUser == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Login required."
                    ));
        }

        if (currentUser.getRole() != Role.MEMBER) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", "Access denied."
                    ));
        }

        String result = body.get("result");

        if (!"completed".equals(result)
                && !"skipped".equals(result)) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid onboarding result."
                    ));
        }

        
        if (currentUser.isGuideOnboardingPending()) {

            currentUser.setGuideOnboardingPending(false);

            currentUser = userRepository.save(currentUser);
        }

        
        HttpSession session = request.getSession(false);

        if (session != null) {

            session.setAttribute("user", currentUser);
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "success", true,
                        "result", result,
                        "onboardingPending", false
                ));
    }
}

