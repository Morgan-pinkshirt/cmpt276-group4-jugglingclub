package com.cmpt276.jugglingclub;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.mockito.Mockito.when;


import org.hamcrest.Matchers;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

import org.springframework.mock.web.MockHttpSession;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;

@SpringBootTest
@AutoConfigureMockMvc

public class usercontrollerTest {
    public static final MediaType APPLICATION_JSON = MediaType.APPLICATION_JSON;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    @Autowired 
    private MockMvc mockMvc;
    @MockitoBean
    private usersRepository usersRepository;

    @Test
    void testlogin() throws Exception { //check to see if id leads to a real review then take you to areyousure.html
        user u1 = new user("billy",passwordEncoder.encode("bob"));

        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));

        mockMvc.perform(MockMvcRequestBuilders.post("/userlogin") // this test for login
        .param("username","billy")
        .param("password", "bob")
    )
    .andExpect(redirectedUrl("/home"));

        mockMvc.perform(MockMvcRequestBuilders.post("/userlogin") // this test for login
        .param("username","bob")
        .param("password", "billy")
    )
    .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","username or password dont match, log in failed"));


}
    @Test 
    void testcreateaccount() throws Exception{
        user u1 = new user("billy",passwordEncoder.encode("bob"));

        u1.setUid(1);
        when(usersRepository.findByName("billy")).thenReturn(Optional.of(u1));
    mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","billy")
        .param("password", "bob")
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/result"))
    .andExpect(MockMvcResultMatchers.model().attribute("message","user name taken, try again"));


    mockMvc.perform(MockMvcRequestBuilders.post("/usermakeaccount")
        .param("username","bob")
        .param("password", "billy")
    ) .andExpect(MockMvcResultMatchers.status().isOk())
    .andExpect(MockMvcResultMatchers.view().name("users/registration-success"));
    }


    @Test 
    void testlogout() throws Exception{
        mockMvc.perform(MockMvcRequestBuilders.get("/logout")
    
).andExpect(redirectedUrl("/home"));
    }
    }
