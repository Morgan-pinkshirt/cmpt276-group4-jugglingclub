package com.cmpt276.jugglingclub.roles;

import com.cmpt276.jugglingclub.models.user;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service 
public class RoleService {

    public Role getRole(HttpSession session) {
        if (session == null) {
            return Role.GUEST;
        }

        user currentUser = (user) session.getAttribute("user");

        if (currentUser == null) {
            return Role.GUEST;
        }

        return currentUser.getRole();


    }

    public boolean isLoggedIn(HttpSession session) {
        return getRole(session) != Role.GUEST;
    }

    public boolean isAdmin(HttpSession session) {
        return getRole(session) == Role.ADMIN;
    }

    
}
