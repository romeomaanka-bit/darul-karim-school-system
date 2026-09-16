package com.darulkarim.school.models;

public class LoginResponse {
    public String accessToken;
    public User user;

    public static class User {
        public String id;
        public String email;
        public String role;
        public Profile student;
        public Profile teacher;
        public Profile parent;
        public String displayName() {
            Profile profile = student != null ? student : (teacher != null ? teacher : parent);
            if (profile != null) return (profile.firstName + " " + profile.lastName).trim();
            return email != null ? email : role;
        }
    }
    public static class Profile { public String id; public String firstName; public String lastName; public String rollNumber; }
}
