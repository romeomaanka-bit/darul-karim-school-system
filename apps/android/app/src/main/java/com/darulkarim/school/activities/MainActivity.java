package com.darulkarim.school.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.darulkarim.school.R;
import com.darulkarim.school.fragments.DashboardFragment;
import com.darulkarim.school.fragments.ResourceListFragment;
import com.darulkarim.school.utils.SessionManager;
import com.google.android.material.navigation.NavigationView;

public class MainActivity extends AppCompatActivity
        implements NavigationView.OnNavigationItemSelectedListener {

    private DrawerLayout drawerLayout;
    private NavigationView navigationView;
    private ActionBarDrawerToggle drawerToggle;
    private SessionManager session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        session = new SessionManager(this);
        drawerLayout = findViewById(R.id.drawer_layout);
        navigationView = findViewById(R.id.navigation_view);

        Toolbar toolbar = findViewById(R.id.main_toolbar);
        setSupportActionBar(toolbar);

        drawerToggle = new ActionBarDrawerToggle(
                this,
                drawerLayout,
                toolbar,
                R.string.navigation_drawer_open,
                R.string.navigation_drawer_close
        );
        drawerLayout.addDrawerListener(drawerToggle);
        drawerToggle.syncState();

        navigationView.setNavigationItemSelectedListener(this);
        setupHeader();
        setupMenuForRole();

        if (savedInstanceState == null) {
            openDashboard();
            navigationView.setCheckedItem(R.id.nav_dashboard);
        }
    }

    private void setupHeader() {
        android.view.View header = navigationView.getHeaderView(0);
        TextView name = header.findViewById(R.id.nav_user_name);
        TextView role = header.findViewById(R.id.nav_user_role);

        String userName = session.name();
        String userRole = session.role();
        name.setText(userName == null || userName.trim().isEmpty()
                ? "Darul-Karim User" : userName);
        role.setText(userRole == null ? "USER" : userRole.toUpperCase());
    }

    private void setupMenuForRole() {
        String role = session.role() == null ? "" : session.role().toUpperCase();

        // Start with everything hidden, then grant only what the role may see.
        int[] all = {
                R.id.nav_students, R.id.nav_teachers, R.id.nav_parents,
                R.id.nav_classes, R.id.nav_subjects, R.id.nav_attendance,
                R.id.nav_timetable, R.id.nav_exams, R.id.nav_results,
                R.id.nav_assignments, R.id.nav_fees, R.id.nav_announcements,
                R.id.nav_notifications, R.id.nav_complaints, R.id.nav_events,
                R.id.nav_reports, R.id.nav_settings
        };
        for (int id : all) hide(id);

        if (role.equals("ADMIN")) {
            for (int id : all) show(id);
        } else if (role.equals("TEACHER")) {
            show(R.id.nav_classes); show(R.id.nav_subjects); show(R.id.nav_attendance);
            show(R.id.nav_timetable); show(R.id.nav_exams); show(R.id.nav_results);
            show(R.id.nav_assignments); show(R.id.nav_announcements); show(R.id.nav_notifications);
        } else if (role.equals("STUDENT")) {
            show(R.id.nav_attendance); show(R.id.nav_timetable); show(R.id.nav_exams);
            show(R.id.nav_results); show(R.id.nav_assignments); show(R.id.nav_fees);
            show(R.id.nav_announcements); show(R.id.nav_notifications); show(R.id.nav_complaints);
        } else if (role.equals("PARENT")) {
            show(R.id.nav_students); show(R.id.nav_attendance); show(R.id.nav_timetable);
            show(R.id.nav_exams); show(R.id.nav_results); show(R.id.nav_assignments);
            show(R.id.nav_fees); show(R.id.nav_announcements); show(R.id.nav_notifications);
        }
    }

    private void show(int id) {
        MenuItem item = navigationView.getMenu().findItem(id);
        if (item != null) item.setVisible(true);
    }

    private void hide(int id) {
        MenuItem item = navigationView.getMenu().findItem(id);
        if (item != null) item.setVisible(false);
    }

    private void openDashboard() {
        getSupportFragmentManager().beginTransaction()
                .replace(R.id.main_content, new DashboardFragment())
                .commit();
        setTitle("Dashboard");
    }

    private void openResource(String resource, String title, boolean canMark) {
        getSupportFragmentManager().beginTransaction()
                .replace(R.id.main_content, ResourceListFragment.create(title, resource, canMark))
                .commit();
        setTitle(title);
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        if (id == R.id.nav_dashboard) openDashboard();
        else if (id == R.id.nav_students) openResource("students", "Students", false);
        else if (id == R.id.nav_teachers) openResource("teachers", "Teachers", false);
        else if (id == R.id.nav_parents) openResource("parents", "Parents", false);
        else if (id == R.id.nav_classes) openResource("classes", "Classes", false);
        else if (id == R.id.nav_subjects) openResource("subjects", "Subjects", false);
        else if (id == R.id.nav_attendance) openResource("attendance", "Attendance", true);
        else if (id == R.id.nav_timetable) openResource("timetable", "Timetable", false);
        else if (id == R.id.nav_exams) openResource("exams", "Exams", false);
        else if (id == R.id.nav_results) openResource("results", "Results", false);
        else if (id == R.id.nav_assignments) openResource("assignments", "Assignments", false);
        else if (id == R.id.nav_fees) openResource("fees", "Fees & Payments", false);
        else if (id == R.id.nav_announcements) openResource("announcements", "Announcements", false);
        else if (id == R.id.nav_notifications) openResource("notifications", "Notifications", false);
        else if (id == R.id.nav_complaints) openResource("complaints", "Complaints", false);
        else if (id == R.id.nav_events) openResource("events", "Events", false);
        else if (id == R.id.nav_reports) openResource("reports", "Reports", false);
        else if (id == R.id.nav_settings) {
            Toast.makeText(this, "Settings coming soon", Toast.LENGTH_SHORT).show();
        } else if (id == R.id.nav_logout) {
            session.clear();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return true;
        }

        drawerLayout.closeDrawer(GravityCompat.START);
        return true;
    }

    @Override
    public void onBackPressed() {
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }
}
