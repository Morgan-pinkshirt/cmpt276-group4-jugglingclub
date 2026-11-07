package com.cmpt276.jugglingclub.models;


import com.cmpt276.jugglingclub.roles.Role;
import java.io.Serializable;
import jakarta.persistence.*;
@Entity 
@Table(name="saves") 
public class save{
    private static final long serialVersionUID = 1L;
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int uid;
    private String name;
    private String projectname;
    private String productType;
    private String productColor;
    private String bodyColor;
    private String brightness;
    private String saturation;
    private String effect;

    public String getProjectname() {
        return projectname;
    }
    public void setProjectname(String projectname) {
        this.projectname = projectname;
    }
    public static long getSerialversionuid() {
        return serialVersionUID;
    }
    
    public void setUid(int uid) {
        this.uid = uid;
    }
    public int getUid() {
        return uid;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getProductType() {
        return productType;
    }
    public void setProductType(String productType) {
        this.productType = productType;
    }
    public String getProductColor() {
        return productColor;
    }
    public void setProductColor(String productColor) {
        this.productColor = productColor;
    }
    public String getBodyColor() {
        return bodyColor;
    }
    public void setBodyColor(String bodyColor) {
        this.bodyColor = bodyColor;
    }
    


    public String getBrightness() {
        return brightness;
    }
    public void setBrightness(String brightness) {
        this.brightness = brightness;
    }
    public String getSaturation() {
        return saturation;
    }
    public void setSaturation(String saturation) {
        this.saturation = saturation;
    }
    public String getEffect() {
        return effect;
    }
    public void setEffect(String effect) {
        this.effect = effect;
    }
    
    public save(String name, String projectname, String productType, String productColor, String bodyColor,
            String brightness, String saturation, String effect) {
        this.name = name;
        this.projectname = projectname;
        this.productType = productType;
        this.productColor = productColor;
        this.bodyColor = bodyColor;
        this.brightness = brightness;
        this.saturation = saturation;
        this.effect = effect;
    }
    public save() {
    }

}
