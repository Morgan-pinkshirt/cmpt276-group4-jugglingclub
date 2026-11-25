package com.cmpt276.jugglingclub.roles;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SynchroPageAccessConfig implements WebMvcConfigurer {

    private final RoleService roleService;

    public SynchroPageAccessConfig(RoleService roleService) {
        this.roleService = roleService;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request,
                                     HttpServletResponse response,
                                     Object handler) throws Exception {
                response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
                if (!roleService.isLoggedIn(request.getSession(false))) {
                    response.sendRedirect(request.getContextPath() + "/userlogin");
                    return false;
                }
                return true;
            }
        }).addPathPatterns("/synchro.html");
    }
}
