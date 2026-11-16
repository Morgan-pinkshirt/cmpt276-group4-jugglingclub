package com.cmpt276.jugglingclub;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasProperty;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

import org.springframework.mock.web.MockHttpSession;

import java.util.ArrayList;
import java.util.Optional;

import com.cmpt276.jugglingclub.models.save;
import com.cmpt276.jugglingclub.models.savesRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.Role;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class savecontrollerTest {

    public static final MediaType APPLICATION_JSON = MediaType.APPLICATION_JSON;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private savesRepository savesRepository;

    @Test
    void Testcustomsave() throws Exception {
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        save s1 = new save("name", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);

        when(savesRepository.findByUid(1)).thenReturn(Optional.of(s1));
        when(savesRepository.findByUid(2)).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.post("/customsave")
                .param("UID", "1")
                .session(session))
                .andExpect(MockMvcResultMatchers.view().name("sim/view"))
                .andExpect(MockMvcResultMatchers.model().attribute("currentSave", s1))
                .andExpect(MockMvcResultMatchers.model().attribute("UID", 1));

        mockMvc.perform(MockMvcRequestBuilders.post("/customsave")
                .param("UID", "1"))
                .andExpect(redirectedUrl("/home"));
    }

    @Test
    void savecustom() throws Exception {
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();
        MvcResult result;
        session.setAttribute("user", u1);
        MockHttpSession resultsession;

        save s1 = new save("name", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);

        when(savesRepository.findByUid(1)).thenReturn(Optional.of(s1));
        when(savesRepository.findByUid(2)).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.post("/savecustom")
                .param("productType", "ball")
                .param("productColor", "#9f1ad3")
                .param("bodyColor", "#ffffff")
                .param("projectname", "projectname")
                .param("brightness", "1")
                .param("saturation", "1")
                .param("effect", "none")
                .param("UID", "1"))
                .andExpect(redirectedUrl("/home"));

        result = mockMvc.perform(MockMvcRequestBuilders.post("/savecustom")
                .param("productType", "club")
                .param("productColor", "#951ad3")
                .param("bodyColor", "#ff9fff")
                .param("projectname", "projectname")
                .param("brightness", "1")
                .param("saturation", "1")
                .param("effect", "none")
                .param("UID", "1")
                .session(session))
                .andExpect(redirectedUrl("/customsave?UID=1"))
                .andReturn();

        resultsession = (MockHttpSession) result.getRequest().getSession(false);

        assertSame(u1, resultsession.getAttribute("user"));
        assertEquals("Your design has been updated!",
                resultsession.getAttribute("message"));

        save newSave = new save("billy", "projectname", "club", "#951ad3", "#ff9fff",
                "1", "1", "none");

        newSave.setUid(2);

        when(savesRepository.save(any(save.class))).thenAnswer(invocation -> {
            save saved = invocation.getArgument(0);
            if (saved.getUid() == 0) {
                saved.setUid(2);
            }
            return saved;
        });

        result = mockMvc.perform(MockMvcRequestBuilders.post("/savecustom")
                .param("productType", "club")
                .param("productColor", "#951ad3")
                .param("bodyColor", "#ff9fff")
                .param("projectname", "projectname")
                .param("brightness", "1")
                .param("saturation", "1")
                .param("effect", "none")
                .param("UID", "new")
                .session(session))
                .andExpect(redirectedUrl("/customsave?UID=2"))
                .andReturn();

        resultsession = (MockHttpSession) result.getRequest().getSession(false);

        assertSame(u1, resultsession.getAttribute("user"));
        assertEquals("Your design has been saved!",
                resultsession.getAttribute("message"));
    }

    @Test
    void viewprojects() throws Exception {
        ArrayList<save> savelist = new ArrayList<save>();
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();

        session.setAttribute("user", u1);

        save s1 = new save("billy", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        save s2 = new save("billy", "beans", "ball", "#9f8ad3", "#ff1fff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);
        s2.setUid(2);

        savelist.add(s1);
        savelist.add(s2);

        when(savesRepository.findAllByName("billy")).thenReturn(savelist);

        mockMvc.perform(MockMvcRequestBuilders.get("/viewsavedprojects"))
                .andExpect(redirectedUrl("/home"));

        mockMvc.perform(MockMvcRequestBuilders.get("/viewsavedprojects")
                .session(session))
                .andExpect(MockMvcResultMatchers.view().name("saves/savedproject"))
                .andExpect(MockMvcResultMatchers.model().attribute("projects", hasItem(
                        allOf(
                                hasProperty("uid", Matchers.is(1)),
                                hasProperty("name", Matchers.is("billy")),
                                hasProperty("projectname", Matchers.is("projectname")),
                                hasProperty("productType", Matchers.is("ball")),
                                hasProperty("productColor", Matchers.is("#9f1ad3")),
                                hasProperty("bodyColor", Matchers.is("#ffffff")),
                                hasProperty("brightness", Matchers.is("1")),
                                hasProperty("saturation", Matchers.is("1")),
                                hasProperty("effect", Matchers.is("none"))
                        ))));
    }

    @Test
    void testdeleteproject() throws Exception {
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();
        MvcResult result;

        session.setAttribute("user", u1);

        save s1 = new save("name", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);

        when(savesRepository.findById(1)).thenReturn(Optional.of(s1));
        when(savesRepository.findById(2)).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.post("/deleteproject")
                .param("UID", "1"))
                .andExpect(redirectedUrl("/home"));

        result = mockMvc.perform(MockMvcRequestBuilders.post("/deleteproject")
                .param("UID", "1")
                .session(session))
                .andExpect(redirectedUrl("/viewsavedprojects"))
                .andReturn();

        MockHttpSession resultsession =
                (MockHttpSession) result.getRequest().getSession(false);

        assertEquals("save deleted successfully",
                resultsession.getAttribute("message"));

        result = mockMvc.perform(MockMvcRequestBuilders.post("/deleteproject")
                .param("UID", "2")
                .session(session))
                .andExpect(redirectedUrl("/home"))
                .andReturn();

        resultsession = (MockHttpSession) result.getRequest().getSession(false);

        assertEquals("project not found",
                resultsession.getAttribute("message"));
    }

    @Test
    void testviewallsaves() throws Exception {
        ArrayList<save> savelist = new ArrayList<save>();
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();

        session.setAttribute("user", u1);

        save s1 = new save("billy", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        save s2 = new save("billy", "beans", "ball", "#9f8ad3", "#ff1fff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);
        s2.setUid(2);

        savelist.add(s1);
        savelist.add(s2);

        when(savesRepository.findAll()).thenReturn(savelist);

        mockMvc.perform(MockMvcRequestBuilders.get("/viewallsaves"))
                .andExpect(redirectedUrl("/home"));

        mockMvc.perform(MockMvcRequestBuilders.get("/viewallsaves")
                .session(session))
                .andExpect(redirectedUrl("/home"));

        u1.setRole(Role.ADMIN);
        session.setAttribute("user", u1);

        mockMvc.perform(MockMvcRequestBuilders.get("/viewallsaves")
                .session(session))
                .andExpect(MockMvcResultMatchers.view().name("saves/adminsavedproject"))
                .andExpect(MockMvcResultMatchers.model().attribute("projects", hasItem(
                        allOf(
                                hasProperty("uid", Matchers.is(1)),
                                hasProperty("name", Matchers.is("billy")),
                                hasProperty("projectname", Matchers.is("projectname")),
                                hasProperty("productType", Matchers.is("ball")),
                                hasProperty("productColor", Matchers.is("#9f1ad3")),
                                hasProperty("bodyColor", Matchers.is("#ffffff")),
                                hasProperty("brightness", Matchers.is("1")),
                                hasProperty("saturation", Matchers.is("1")),
                                hasProperty("effect", Matchers.is("none"))
                        ))));
    }

    @Test
    void testviewproject() throws Exception {
        user u1 = new user("billy", "bob");
        MockHttpSession session = new MockHttpSession();

        session.setAttribute("user", u1);

        save s1 = new save("billy", "projectname", "ball", "#9f1ad3", "#ffffff",
                "1", "1", "none");

        u1.setUid(1);
        s1.setUid(1);

        when(savesRepository.findByUid(1)).thenReturn(Optional.of(s1));

        mockMvc.perform(MockMvcRequestBuilders.post("/viewproject")
                .param("UID", "1"))
                .andExpect(redirectedUrl("/home"));

        mockMvc.perform(MockMvcRequestBuilders.post("/viewproject")
                .param("UID", "1")
                .session(session))
                .andExpect(redirectedUrl("/home"));

        u1.setRole(Role.ADMIN);
        session.setAttribute("user", u1);

        mockMvc.perform(MockMvcRequestBuilders.post("/viewproject")
                .param("UID", "1")
                .session(session))
                .andExpect(MockMvcResultMatchers.view().name("sim/adminview"))
                .andExpect(MockMvcResultMatchers.model().attribute("UID", "1"))
                .andExpect(MockMvcResultMatchers.model().attribute("currentSave", s1));
    }
}

