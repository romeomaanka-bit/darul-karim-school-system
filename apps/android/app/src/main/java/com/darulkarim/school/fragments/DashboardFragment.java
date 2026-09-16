package com.darulkarim.school.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.darulkarim.school.R;
import com.darulkarim.school.models.ApiEnvelope;
import com.darulkarim.school.models.DashboardData;
import com.darulkarim.school.network.RetrofitClient;
import com.google.android.material.button.MaterialButton;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardFragment extends Fragment {

    private TextView tvStudents;
    private TextView tvTeachers;
    private TextView tvClasses;
    private TextView tvAttendance;
    private TextView tvFees;
    private TextView tvExams;

    private TextView tvAttendanceSubtitle;
    private TextView tvFeesSubtitle;

    private View dashboardProgress;
    private MaterialButton refreshButton;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {

        return inflater.inflate(
                R.layout.fragment_dashboard,
                container,
                false
        );
    }

    @Override
    public void onViewCreated(
            @NonNull View view,
            @Nullable Bundle savedInstanceState) {

        super.onViewCreated(view, savedInstanceState);

        tvStudents = view.findViewById(R.id.tv_students);
        tvTeachers = view.findViewById(R.id.tv_teachers);
        tvClasses = view.findViewById(R.id.tv_classes);
        tvAttendance = view.findViewById(R.id.tv_attendance);
        tvFees = view.findViewById(R.id.tv_fees);
        tvExams = view.findViewById(R.id.tv_exams);

        tvAttendanceSubtitle =
                view.findViewById(R.id.tv_attendance_subtitle);

        tvFeesSubtitle =
                view.findViewById(R.id.tv_fees_subtitle);

        dashboardProgress =
                view.findViewById(R.id.dashboard_progress);

        refreshButton =
                view.findViewById(R.id.button_refresh_dashboard);

        refreshButton.setOnClickListener(v -> loadDashboard());

        loadDashboard();
    }

    private void loadDashboard() {

        showLoading(true);

        RetrofitClient.get(requireContext())
                .dashboard()
                .enqueue(new Callback<ApiEnvelope<DashboardData>>() {

                    @Override
                    public void onResponse(
                            @NonNull Call<ApiEnvelope<DashboardData>> call,
                            @NonNull Response<ApiEnvelope<DashboardData>> response) {

                        showLoading(false);

                        if (!response.isSuccessful()) {
                            showError(
                                    "Unable to load dashboard. HTTP "
                                            + response.code()
                            );
                            return;
                        }

                        ApiEnvelope<DashboardData> envelope =
                                response.body();

                        if (envelope == null) {
                            showError("Dashboard response is empty.");
                            return;
                        }

                        if (!envelope.success) {
                            showError(
                                    envelope.message != null
                                            ? envelope.message
                                            : "Unable to load dashboard."
                            );
                            return;
                        }

                        if (envelope.data == null) {
                            showError("Dashboard data is empty.");
                            return;
                        }

                        updateDashboard(envelope.data);
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<ApiEnvelope<DashboardData>> call,
                            @NonNull Throwable t) {

                        showLoading(false);

                        showError(
                                "Network error. Check your connection."
                        );
                    }
                });
    }

    private void updateDashboard(DashboardData data) {

        // Default values
        tvStudents.setText("0");
        tvTeachers.setText("0");
        tvClasses.setText("0");
        tvAttendance.setText("0");
        tvFees.setText("$0");
        tvExams.setText("0");

        tvAttendanceSubtitle.setText(
                "No attendance recorded today"
        );

        tvFeesSubtitle.setText(
                "No fee data"
        );

        if (data.cards != null) {

            for (JsonElement element : data.cards) {

                if (!element.isJsonObject()) {
                    continue;
                }

                JsonObject card = element.getAsJsonObject();

                String key = getString(card, "key");
                String value = getString(card, "value");
                String format = getString(card, "format");

                if (key == null) {
                    continue;
                }

                key = key.toLowerCase(Locale.US);

                switch (key) {

                    case "students":
                        tvStudents.setText(
                                cleanValue(value)
                        );
                        break;

                    case "teachers":
                        tvTeachers.setText(
                                cleanValue(value)
                        );
                        break;

                    case "classes":
                        tvClasses.setText(
                                cleanValue(value)
                        );
                        break;

                    case "attendance":
                        updateAttendance(value);
                        break;

                    case "fees":
                        updateFees(value, format);
                        break;

                    case "exams":
                        tvExams.setText(
                                cleanValue(value)
                        );
                        break;

                    default:
                        break;
                }
            }
        }

        // Upcoming exams can also be used as fallback.
        if (data.upcomingExams != null
                && tvExams.getText().toString().equals("0")) {

            tvExams.setText(
                    String.valueOf(data.upcomingExams.size())
            );
        }
    }

    private void updateAttendance(String value) {

        String clean = cleanValue(value);

        if (clean.isEmpty()) {
            clean = "0";
        }

        /*
         * Current API dashboard returns an attendance
         * value. We display it directly.
         */
        tvAttendance.setText(clean);

        tvAttendanceSubtitle.setText(
                "Today's attendance"
        );
    }

    private void updateFees(
            String value,
            String format) {

        String clean = cleanValue(value);

        if (clean.isEmpty()) {
            clean = "0";
        }

        try {

            double amount =
                    Double.parseDouble(
                            clean.replace("$", "")
                    );

            if ("currency".equalsIgnoreCase(format)) {

                tvFees.setText(
                        formatCurrency(amount)
                );

            } else {

                tvFees.setText(clean);
            }

        } catch (Exception ignored) {

            tvFees.setText(
                    "currency".equalsIgnoreCase(format)
                            ? "$" + clean
                            : clean
            );
        }

        tvFeesSubtitle.setText(
                "Pending fees"
        );
    }

    private String getString(
            JsonObject object,
            String name) {

        if (!object.has(name)
                || object.get(name).isJsonNull()) {

            return null;
        }

        JsonElement element = object.get(name);

        try {
            return element.getAsString();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String cleanValue(String value) {

        if (value == null) {
            return "0";
        }

        return value.trim();
    }

    private String formatCurrency(double amount) {

        if (amount == Math.floor(amount)) {

            return String.format(
                    Locale.US,
                    "$%.0f",
                    amount
            );
        }

        return String.format(
                Locale.US,
                "$%.2f",
                amount
        );
    }

    private void showLoading(boolean loading) {

        if (dashboardProgress != null) {

            dashboardProgress.setVisibility(
                    loading
                            ? View.VISIBLE
                            : View.GONE
            );
        }

        if (refreshButton != null) {

            refreshButton.setEnabled(!loading);
        }
    }

    private void showError(String message) {

        if (!isAdded()) {
            return;
        }

        Toast.makeText(
                requireContext(),
                message,
                Toast.LENGTH_LONG
        ).show();
    }
}