package com.cmpt276.jugglingclub;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;


import static org.mockito.Mockito.when;



import static org.junit.jupiter.api.Assertions.assertTrue;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

import org.springframework.mock.web.MockHttpSession;

import java.util.Optional;

import com.cmpt276.jugglingclub.controllers.usercontroller;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import java.util.Random;

@SpringBootTest

@AutoConfigureMockMvc(addFilters = false)

public class usercontrollerTest {
    public static final MediaType APPLICATION_JSON = MediaType.APPLICATION_JSON;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    @Autowired 
    private MockMvc mockMvc;
    @MockitoBean
    private usersRepository usersRepository;
    @Mock
    private Random mockRandom;
    @Autowired
    private usercontroller controller;
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(controller, "rand", mockRandom);
    }

 
    @Test
    void testgetlogin() throws Exception{
       
        mockMvc.perform(MockMvcRequestBuilders.get("/userlogin"))
        .andExpect(MockMvcResultMatchers.view().name(("users/userlogin")));

        user u1 = new user("billy",passwordEncoder.encode("bob"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user",u1);
        mockMvc.perform(MockMvcRequestBuilders.get("/userlogin").session(session))
    .andExpect(redirectedUrl("/home"));

    }

    @Test

    void testlogin() throws Exception { //check to see if id leads to a real review then take you to areyousure.html
        user u1 = new user("billy",passwordEncoder.encode("bob"));
        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/userlogin") // this test for login
        .param("username","billy")
        .param("password", "bob")
    )
    .andExpect(redirectedUrl("/home"))
    .andReturn();
    MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session.getAttribute("user") == u1);

    result = mockMvc.perform(MockMvcRequestBuilders.post("/userlogin") // this test for login
        .param("username","bob")
        .param("password", "billy")
    )
    .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","username or password dont match, log in failed"))
    .andReturn();
    session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session == null || session.isInvalid());

    result = mockMvc.perform(MockMvcRequestBuilders.post("/userlogin") // this test for login
        .param("username","billy")
        .param("password", "billy")
    )
    .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","username or password dont match, log in failed"))
    .andReturn();
    session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session == null || session.isInvalid());

}
    @Test 
    void makeaccount() throws Exception{
        
        user u1 = new user("billy",passwordEncoder.encode("bob"));
        u1.setUid(1);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user",u1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));
    MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","billy")
        .param("password", "bob")
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","user name taken, try again"))
    .andReturn();
    MockHttpSession resultSession = (MockHttpSession) result.getRequest().getSession(false);
    assertTrue(resultSession == null || resultSession.isInvalid());
    
    session = new MockHttpSession();
    session.setAttribute("user",u1);
    result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","billy")
        .param("password", "bob")
        .session(session)
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","user name taken, try again"))
    .andReturn();
    resultSession = (MockHttpSession) result.getRequest().getSession(false);
    assertTrue(resultSession == null || resultSession.isInvalid());

    session = new MockHttpSession();
    session.setAttribute("user",u1);

    result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","bob")
        .param("password", "billy")
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/registration-success"))
    .andReturn();
    resultSession = (MockHttpSession) result.getRequest().getSession(false);
    assertTrue(resultSession == null || resultSession.isInvalid());
    session = new MockHttpSession();
    session.setAttribute("user",u1);
    result = mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","bob")
        .param("password", "billy")
        .session(session)
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/registration-success"))
    .andReturn();
    resultSession = (MockHttpSession) result.getRequest().getSession(false);
    assertTrue(resultSession == null || resultSession.isInvalid());
    }


    @Test 
    void testlogout() throws Exception{
        user u1 = new user("billy",passwordEncoder.encode("bob"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("user",u1);

       MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/logout")
        .session(session)
    
).andExpect(redirectedUrl("/home"))
    .andReturn();
        MockHttpSession resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());

        result = mockMvc.perform(MockMvcRequestBuilders.get("/logout")
    
).andExpect(redirectedUrl("/home"))
    .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());

    }

    

        @Test 
    void testanswersecure() throws Exception{
        user u1 = new user("billy",passwordEncoder.encode("bob"));
        u1.setUid(1);
        u1.setEmail("google@mail");
        u1.setFavcolor("color");
        u1.setMothername("mother");
        u1.setFavplace("place");
        u1.setFavsubject("subject");
        u1.setHometown("town");
        u1.setFavgame("game");
        MvcResult result;
        MockHttpSession resultSession;
        MockHttpSession session;
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(0);
        session.setAttribute("user",u1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","what is your favourite color?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","favcolor"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(1);
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","what is your mother's name?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","mothername"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(2);
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","what is your favourite place?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","favplace"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(3);
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","what is your favourite subject?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","favsubject"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(4);
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","where are you born in?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","hometown"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(5);
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","what is your favourite game?"))
        .andExpect(MockMvcResultMatchers.model().attribute("username","billy"))
        .andExpect(MockMvcResultMatchers.model().attribute("question","favgame"))
        .andExpect(MockMvcResultMatchers.view().name("users/recoverpassword"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());

        session = new MockHttpSession();
        when(mockRandom.nextInt(6)).thenReturn(69);//when it is wrong
        session.setAttribute("user",u1);
        result = mockMvc.perform(MockMvcRequestBuilders.post("/answersecure").param("username","billy").session(session)
        )
        .andExpect(MockMvcResultMatchers.model().attribute("message","ERROR OCCURED!!!!!!"))
        .andExpect(MockMvcResultMatchers.view().name("users/result"))
        .andReturn();
        resultSession = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(resultSession == null || resultSession.isInvalid());
    }
    @Test 
    void testsecureanswer() throws Exception{
        user u1 = new user("billy",passwordEncoder.encode("bob"));
        u1.setUid(1);
        u1.setEmail("google@mail");
        u1.setFavcolor("color");
        u1.setMothername("mother");
        u1.setFavplace("place");
        u1.setFavsubject("subject");
        u1.setHometown("town");
        u1.setFavgame("game");
        MvcResult result;
        MockHttpSession session;
        session = new MockHttpSession();
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));
        when(usersRepository.findByName("bob")).thenReturn(Optional.of(new user("bob",passwordEncoder.encode("bob"))));
        when(usersRepository.findByName("baby")).thenReturn(Optional.empty());

        result = mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
        .param("username", "baby")
        .param("answer", "town")
        .param("question", "hometown")
    ).andExpect(MockMvcResultMatchers.model().attribute("message","account dont exist"))
    .andExpect(MockMvcResultMatchers.view().name("users/result")).andReturn();

        session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session == null || session.isInvalid());
        result = mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
        .param("username", "billy")
        .param("answer", "town")
        .param("question", "hometown")
    ).andExpect(redirectedUrl("/home")).andReturn();

        session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session.getAttribute("user") == u1);
        assertTrue(session.getAttribute("message") == "your password is now 12345, please change it in settings");

        result = mockMvc.perform(MockMvcRequestBuilders.post("/secureanswer")
        .param("username", "bob")
        .param("answer", "town")
        .param("question", "hometown")
    ).andExpect(MockMvcResultMatchers.model().attribute("message","WRONG ANswer"))
    .andExpect(MockMvcResultMatchers.view().name("users/result")).andReturn();
        session = (MockHttpSession) result.getRequest().getSession(false);
        assertTrue(session == null || session.isInvalid());
    }
    }
    
