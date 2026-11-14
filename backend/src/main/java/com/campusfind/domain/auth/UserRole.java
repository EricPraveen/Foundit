package com.campusfind.domain.auth;

public enum UserRole {
    STUDENT,
    SECURITY_OFFICER,
    SUPER_ADMIN;

    public String toAuthority() {
        return "ROLE_" + this.name();
    }
}
