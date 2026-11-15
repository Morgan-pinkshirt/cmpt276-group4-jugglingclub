package com.cmpt276.jugglingclub.roles;

public enum Role {
    GUEST("Guest"),
    MEMBER("jester"),
    ADMIN("trickster"),
    SUPER_ADMIN("joke");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}


