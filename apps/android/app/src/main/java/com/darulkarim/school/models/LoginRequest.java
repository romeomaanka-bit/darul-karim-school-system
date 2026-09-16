package com.darulkarim.school.models;

public class LoginRequest {
    public final String identifier;
    public final String password;
    public LoginRequest(String identifier, String password) { this.identifier = identifier; this.password = password; }
}
