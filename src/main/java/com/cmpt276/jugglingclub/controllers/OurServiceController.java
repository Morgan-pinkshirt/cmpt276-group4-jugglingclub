package com.cmpt276.jugglingclub.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OurServiceController {
    @GetMapping("/our-service")
    public String ourService() {
        return "roles/our-service";
    }
}
