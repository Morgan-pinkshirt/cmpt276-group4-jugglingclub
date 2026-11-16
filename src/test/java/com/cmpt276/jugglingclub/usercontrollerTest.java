package com.cmpt276.jugglingclub;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.models.AccountToken.TokenType;
import com.cmpt276.jugglingclub.services.AccountTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class usercontrollerTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private usersRepository usersRepository;

    @MockitoBean
    private AccountTokenService tokenService;

    @Test
    void testgetlogin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/userlogin"))
                .andExpect(MockMvcResultMatchers.view().name("users/userlogin"));

        user u1 = new user("billy", passwordEncoder.encode("bob"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        mockMvc.perform(MockMvcRequestBuilders.get("/userlogin").session(session))
                .andExpect(redirectedUrl("/home"));
    }

    @Test
    void testlogin() throws Exception {
        user u1 = new user("billy", passwordEncoder.encode("bob"));
        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/userlogin")
                        .param("username", "billy")
                        .param("password", "bob"))
                .andExpect(redirectedUrl("/home"))
                .andReturn();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session);
        assertSame(u1, session.getAttribute("user"));

        mockMvc.perform(MockMvcRequestBuilders.post("/userlogin")
                        .param("username", "bob")
                        .param("password", "billy"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "username or password dont match, log in failed"));

        mockMvc.perform(MockMvcRequestBuilders.post("/userlogin")
                        .param("username", "billy")
                        .param("password", "billy"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "username or password dont match, log in failed"));
    }

    @Test
    void makeaccount() throws Exception {
        user u1 = new user("billy", passwordEncoder.encode("bob"));
        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
                        .param("username", "billy")
                        .param("password", "bob"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "user name taken, try again"));

        MockHttpSession oldSession = new MockHttpSession();
        oldSession.setAttribute("user", u1);
        mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
                        .param("username", "billy")
                        .param("password", "bob")
                        .session(oldSession))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/result"));
        assertSame(u1, oldSession.getAttribute("user"));

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
                        .param("username", "bob")
                        .param("password", "billy"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/registration-success"))
                .andReturn();
        MockHttpSession resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
                        .param("username", "bob")
                        .param("password", "billy")
                        .session(session))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.view().name("users/registration-success"))
                .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
    }

    @Test
    void testlogout() throws Exception {
        user u1 = new user("billy", passwordEncoder.encode("bob"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user", u1);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/logout")
                        .session(session))
                .andExpect(redirectedUrl("/home"))
                .andReturn();
        MockHttpSession resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());

        result = mockMvc.perform(MockMvcRequestBuilders.get("/logout"))
                .andExpect(redirectedUrl("/home"))
                .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
    }

    @Test
    void testanswersecure() throws Exception {
        user u1 = new user("billy", passwordEncoder.encode("bob"));
        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        mockMvc.perform(MockMvcRequestBuilders.post("/answersecure")
                        .param("username", "missing"))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute("message", "account dont exist"));

        mockMvc.perform(MockMvcRequestBuilders.post("/answersecure")
                        .param("username", "billy"))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "account did not set up questions"));

        String[] questions = {"favcolor", "mothername", "favplace", "favsubject", "hometown", "favgame"};
        String[] messages = {
                "what is your favourite color?",
                "what is your mother's name?",
                "what is your favourite place?",
                "what is your favourite subject?",
                "where are you born in?",
                "what is your favourite game?"
        };

        for (int i = 0; i < questions.length; i++) {
            u1.setFavcolor("");
            u1.setMothername("");
            u1.setFavplace("");
            u1.setFavsubject("");
            u1.setHometown("");
            u1.setFavgame("");

            switch (questions[i]) {
                case "favcolor" -> u1.setFavcolor("answer");
                case "mothername" -> u1.setMothername("answer");
                case "favplace" -> u1.setFavplace("answer");
                case "favsubject" -> u1.setFavsubject("answer");
                case "hometown" -> u1.setHometown("answer");
                case "favgame" -> u1.setFavgame("answer");
            }

            MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure")
                            .param("username", "billy"))
                    .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
                    .andExpect(MockMvcResultMatchers.model().attribute("message", messages[i]))
                    .andExpect(MockMvcResultMatchers.model().attribute("username", "billy"))
                    .andExpect(MockMvcResultMatchers.model().attribute("question", questions[i]))
                    .andReturn();

            MockHttpSession recoverySession = (MockHttpSession) result.getRequest().getSession(false);
            assertNotNull(recoverySession);
            assertEquals(1, recoverySession.getAttribute("recoveryUid"));
            assertEquals(questions[i], recoverySession.getAttribute("recoveryQuestion"));
        }
    }

    @Test
    void testsecureanswer() throws Exception {
        user u1 = new user("billy", passwordEncoder.encode("bob"));
        u1.setUid(1);
        u1.setHometown("town");
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
                        .param("username", "baby")
                        .param("answer", "town")
                        .param("question", "hometown"))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute("message", "account dont exist"));

        mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
                        .param("username", "billy")
                        .param("answer", "town")
                        .param("question", "hometown"))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "Security question session expired or invalid."));

        MockHttpSession wrongAnswerSession = new MockHttpSession();
        wrongAnswerSession.setAttribute("recoveryUid", 1);
        wrongAnswerSession.setAttribute("recoveryQuestion", "hometown");
        mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
                        .param("username", "billy")
                        .param("answer", "wrong")
                        .param("question", "hometown")
                        .session(wrongAnswerSession))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute("message", "WRONG ANswer"));

        MockHttpSession correctAnswerSession = new MockHttpSession();
        correctAnswerSession.setAttribute("recoveryUid", 1);
        correctAnswerSession.setAttribute("recoveryQuestion", "hometown");
        when(tokenService.createToken(eq(u1), eq(TokenType.PASSWORD_RESET), isNull()))
                .thenReturn("test-reset-token");

        mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
                        .param("username", "billy")
                        .param("answer", "TOWN")
                        .param("question", "hometown")
                        .session(correctAnswerSession))
                .andExpect(redirectedUrl("/reset-password?token=test-reset-token"));

        assertNull(correctAnswerSession.getAttribute("recoveryUid"));
        assertNull(correctAnswerSession.getAttribute("recoveryQuestion"));

        mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
                        .param("username", "billy")
                        .param("answer", "town")
                        .param("question", "hometown")
                        .session(correctAnswerSession))
                .andExpect(MockMvcResultMatchers.view().name("users/result"))
                .andExpect(MockMvcResultMatchers.model().attribute(
                        "message", "Security question session expired or invalid."));
    }
}

    
