package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.controllers.SaveTransferController;
import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.RoleService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SaveTransferControllerTest {

    @Mock
    private savesRepository saveREPO;

    @Mock
    private RoleService roleService;

    @Mock
    private RedirectAttributes redirectAttributes;

    private SaveTransferController controller;

    @BeforeEach
    void setUp() {
        controller = new SaveTransferController(
                saveREPO,
                roleService,
                JsonMapper.builder().build()
        );
    }

    private MockHttpSession createSession(String username) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", new user(username, "password"));
        return session;
    }

    private save createProject(String username) {
        save project = new save(
                username,
                "My Project",
                "ball",
                "red",
                "blue",
                "1",
                "1",
                "none"
        );
        project.setUid(10);
        return project;
    }

    private MockMultipartFile createFile(String json) {
        return new MockMultipartFile(
                "file",
                "project.json",
                "application/json",
                json.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String validJSON() {
        return """
                {
                  "projectname": "My Project",
                  "productType": "ball",
                  "productColor": "red",
                  "bodyColor": "blue",
                  "brightness": "1",
                  "saturation": "1",
                  "effect": "none"
                }
                """;
    }

    @Test
    void testExportProject() {
        MockHttpSession session = createSession("billy");
        save project = createProject("billy");

        when(roleService.isLoggedIn(session)).thenReturn(true);
        when(saveREPO.findByUid(10))
                .thenReturn(Optional.of(project));

        ResponseEntity<?> result = controller.exportProject(10, session);

        assertEquals(HttpStatus.OK, result.getStatusCode());

        assertEquals(
                MediaType.APPLICATION_JSON,
                result.getHeaders().getContentType()
        );

        assertEquals(
                "attachment; filename=\"jester-project-10.json\"",
                result.getHeaders().getFirst(
                        HttpHeaders.CONTENT_DISPOSITION
                )
        );

        assertInstanceOf(Map.class, result.getBody());

        Map<?, ?> data = (Map<?, ?>) result.getBody();

        assertEquals("My Project", data.get("projectname"));
        assertEquals("ball", data.get("productType"));
        assertEquals("red", data.get("productColor"));
        assertEquals("blue", data.get("bodyColor"));
        assertEquals("1", data.get("brightness"));
        assertEquals("1", data.get("saturation"));
        assertEquals("none", data.get("effect"));

        assertEquals(7, data.size());
        assertFalse(data.containsKey("uid"));
        assertFalse(data.containsKey("name"));

        verify(saveREPO).findByUid(10);
    }

    @Test
    void testExportWithoutLogin() {
        MockHttpSession session = new MockHttpSession();

        ResponseEntity<?> result = controller.exportProject(10, session);

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                result.getStatusCode()
        );

        assertEquals("Please log in.", result.getBody());

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testExportOtherUsersProject() {
        MockHttpSession session = createSession("billy");
        save project = createProject("john");

        when(roleService.isLoggedIn(session)).thenReturn(true);
        when(saveREPO.findByUid(10))
                .thenReturn(Optional.of(project));

        ResponseEntity<?> result = controller.exportProject(10, session);

        assertEquals(HttpStatus.NOT_FOUND, result.getStatusCode());
        assertEquals("Project not found.", result.getBody());

        verify(saveREPO).findByUid(10);
    }

    @Test
    void testExportNonexistentProject() {
        MockHttpSession session = createSession("billy");

        when(roleService.isLoggedIn(session)).thenReturn(true);
        when(saveREPO.findByUid(999))
                .thenReturn(Optional.empty());

        ResponseEntity<?> result = controller.exportProject(999, session);

        assertEquals(HttpStatus.NOT_FOUND, result.getStatusCode());
        assertEquals("Project not found.", result.getBody());
    }

    @Test
    void testImportProject() {
        MockHttpSession session = createSession("billy");
        MockMultipartFile file = createFile(validJSON());

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        ArgumentCaptor<save> captor =
                ArgumentCaptor.forClass(save.class);

        verify(saveREPO).save(captor.capture());

        save imported = captor.getValue();

        assertEquals("billy", imported.getName());
        assertEquals("My Project", imported.getProjectname());
        assertEquals("ball", imported.getProductType());
        assertEquals("red", imported.getProductColor());
        assertEquals("blue", imported.getBodyColor());
        assertEquals("1", imported.getBrightness());
        assertEquals("1", imported.getSaturation());
        assertEquals("none", imported.getEffect());

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Project imported successfully."
        );
    }

    @Test
    void testImportWithoutLogin() {
        MockHttpSession session = new MockHttpSession();
        MockMultipartFile file = createFile(validJSON());

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/home", result);

        verifyNoInteractions(saveREPO);
        verifyNoInteractions(redirectAttributes);
    }

    @Test
    void testImportWithoutSessionUser() {
        MockHttpSession session = new MockHttpSession();
        MockMultipartFile file = createFile(validJSON());

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/home", result);

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testImportEmptyFile() {
        MockHttpSession session = createSession("billy");

        MockMultipartFile file = createFile("");

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Please select a JSON file."
        );

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testImportInvalidJSON() {
        MockHttpSession session = createSession("billy");

        MockMultipartFile file = createFile("{invalid json}");

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Invalid project JSON file."
        );

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testImportMissingFields() {
        MockHttpSession session = createSession("billy");

        MockMultipartFile file = createFile("""
                {
                  "projectname": "Incomplete Project",
                  "productType": "ball"
                }
                """);

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Invalid project JSON file."
        );

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testImportTooLong() {
        MockHttpSession session = createSession("billy");

        String longName = "a".repeat(256);

        MockMultipartFile file = createFile(
                """
                {
                  "projectname": "%s",
                  "productType": "ball",
                  "productColor": "red",
                  "bodyColor": "blue"
                }
                """.formatted(longName)
        );

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Invalid project JSON file."
        );

        verifyNoInteractions(saveREPO);
    }

    @Test
    void testImportOwnership() {
        MockHttpSession session = createSession("billy");

        MockMultipartFile file = createFile("""
                {
                  "uid": 999,
                  "name": "john",
                  "projectname": "Imported Project",
                  "productType": "ball",
                  "productColor": "red",
                  "bodyColor": "blue",
                  "brightness": "1",
                  "saturation": "1",
                  "effect": "none"
                }
                """);

        when(roleService.isLoggedIn(session)).thenReturn(true);

        String result = controller.importProject(
                file,
                session,
                redirectAttributes
        );

        assertEquals("redirect:/viewsavedprojects", result);

        ArgumentCaptor<save> captor =
                ArgumentCaptor.forClass(save.class);

        verify(saveREPO).save(captor.capture());

        save imported = captor.getValue();

        assertEquals("billy", imported.getName());
        assertEquals(0, imported.getUid());
        assertEquals("Imported Project", imported.getProjectname());

        verify(redirectAttributes).addFlashAttribute(
                "importMessage",
                "Project imported successfully."
        );
    }
}

