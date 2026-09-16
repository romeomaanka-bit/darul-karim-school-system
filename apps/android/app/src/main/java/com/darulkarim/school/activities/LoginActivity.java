package com.darulkarim.school.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import com.darulkarim.school.R;
import com.darulkarim.school.utils.SessionManager;
import com.darulkarim.school.viewmodel.LoginViewModel;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class LoginActivity extends AppCompatActivity {
    private TextInputEditText identifier;
    private TextInputEditText password;
    private TextView error;
    private View progress;
    private MaterialButton loginButton;
    private SessionManager session;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        if (session.isSignedIn()) { openMain(); return; }
        setContentView(R.layout.activity_login);
        identifier = findViewById(R.id.input_identifier); password = findViewById(R.id.input_password); error = findViewById(R.id.login_error); progress = findViewById(R.id.login_progress); loginButton = findViewById(R.id.button_login);
        LoginViewModel viewModel = new ViewModelProvider(this).get(LoginViewModel.class);
        viewModel.state().observe(this, state -> {
            progress.setVisibility(state.loading ? View.VISIBLE : View.GONE); loginButton.setEnabled(!state.loading);
            if (state.error != null) { error.setText(state.error); error.setVisibility(View.VISIBLE); }
            if (state.result != null) { session.save(state.result.accessToken, state.result.user.role, state.result.user.displayName()); openMain(); }
        });
        loginButton.setOnClickListener(view -> {
            String login = value(identifier); String pass = value(password); error.setVisibility(View.GONE);
            if (login.length() < 3) { showError("Enter your email or roll number."); return; }
            if (pass.length() < 8) { showError("Password must contain at least 8 characters."); return; }
            viewModel.login(login, pass);
        });
    }
    private String value(TextInputEditText input) { return input.getText() == null ? "" : input.getText().toString().trim(); }
    private void showError(String message) { error.setText(message); error.setVisibility(View.VISIBLE); }
    private void openMain() { startActivity(new Intent(this, MainActivity.class)); finish(); }
}
