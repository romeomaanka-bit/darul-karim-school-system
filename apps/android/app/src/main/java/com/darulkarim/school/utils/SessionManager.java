package com.darulkarim.school.utils;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

public class SessionManager {
    private static final String FILE = "darul_karim_secure_session";
    private final SharedPreferences preferences;
    public SessionManager(Context context) {
        try {
            MasterKey key = new MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build();
            preferences = EncryptedSharedPreferences.create(context, FILE, key, EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
        } catch (Exception error) { throw new IllegalStateException("Unable to initialize encrypted session storage", error); }
    }
    public void save(String token, String role, String name) { preferences.edit().putString("token", token).putString("role", role).putString("name", name).apply(); }
    public String token() { return preferences.getString("token", null); }
    public String role() { return preferences.getString("role", null); }
    public String name() { return preferences.getString("name", ""); }
    public boolean isSignedIn() { return token() != null && role() != null; }
    public void clear() { preferences.edit().clear().apply(); }
}
