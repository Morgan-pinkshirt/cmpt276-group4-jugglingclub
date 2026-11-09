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
    private String email;
    private String theme = "light";

    private String favcolor;
    private String mothername;
    private String favplace;
    private String favsubject;
    private String hometown;
    private String favgame;
    
    @Enumerated(EnumType.STRING)

    
    private Role role = Role.MEMBER;
    
    public String getFavcolor() {
        return favcolor;
    }
    public void setFavcolor(String favcolor) {
        this.favcolor = favcolor;
    }
    public String getMothername() {
        return mothername;
    }
    public void setMothername(String mothername) {
        this.mothername = mothername;
    }
    public String getFavplace() {
        return favplace;
    }
    public void setFavplace(String favplace) {
        this.favplace = favplace;
    }
    public String getFavsubject() {
        return favsubject;
    }
    public void setFavsubject(String favsubject) {
        this.favsubject = favsubject;
    }
    public String getHometown() {
        return hometown;
    }
    public void setHometown(String hometown) {
        this.hometown = hometown;
    }
    public String getFavgame() {
        return favgame;
    }
    public void setFavgame(String favgame) {
        this.favgame = favgame;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
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
