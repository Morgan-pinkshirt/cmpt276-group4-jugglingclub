package com.cmpt276.jugglingclub.models;


import jakarta.persistence.*;

@Entity 
@Table(name="users") // this should automaticly make a users table on database
public class user {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int uid;
    private String name;
    private String password;
    
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

    
    
}
