package com.cmpt276.jugglingclub.models;

import com.cmpt276.jugglingclub.roles.Role;
import java.io.Serializable;
import jakarta.persistence.*;

@Entity 
@Table(name="users") // this should automaticly make a users table on database
public class user implements Serializable{
    private static final long serialVersionUID = 1L;
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int uid;
    private String name;
    private String password;
    private String theme = "light";
    @Enumerated(EnumType.STRING)
    private Role role = Role.MEMBER;
    
    public user() {
    }
    public user(String name, String password) {
        this.name = name;
        this.password = password;
    }
    public int getUid() {
        return uid;
    }
    public void setUid(int uid) {
        this.uid = uid;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getTheme() {
    return theme == null ? "light" : theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Role getRole() {
    return role == null ? Role.MEMBER : role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    
    
}
