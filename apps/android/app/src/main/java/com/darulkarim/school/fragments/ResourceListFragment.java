package com.darulkarim.school.fragments;

import android.app.AlertDialog;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.darulkarim.school.R;
import com.darulkarim.school.adapters.JsonRecordAdapter;
import com.darulkarim.school.models.ApiEnvelope;
import com.darulkarim.school.models.PaginatedData;
import com.darulkarim.school.network.RetrofitClient;
import com.darulkarim.school.utils.SessionManager;
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.JsonObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResourceListFragment extends Fragment {

    private static final String TITLE = "title";
    private static final String RESOURCE = "resource";
    private static final String MARK = "mark";

    private String resource;
    private String title;
    private boolean canMark;

    private JsonRecordAdapter adapter;
    private TextView status;

    public static ResourceListFragment create(
            String title,
            String resource,
            boolean canMark
    ) {
        ResourceListFragment fragment = new ResourceListFragment();

        Bundle args = new Bundle();
        args.putString(TITLE, title);
        args.putString(RESOURCE, resource);
        args.putBoolean(MARK, canMark);

        fragment.setArguments(args);

        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle state) {
        super.onCreate(state);

        Bundle args = requireArguments();

        title = args.getString(TITLE);
        resource = args.getString(RESOURCE);
        canMark = args.getBoolean(MARK);
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle state
    ) {
        View view = inflater.inflate(
                R.layout.fragment_records,
                container,
                false
        );

        status = view.findViewById(R.id.record_status);

        RecyclerView list = view.findViewById(R.id.record_list);

        adapter = new JsonRecordAdapter();

        list.setLayoutManager(
                new LinearLayoutManager(requireContext())
        );

        list.setAdapter(adapter);

        TextInputEditText search =
                view.findViewById(R.id.record_search);

        search.addTextChangedListener(
                new android.text.TextWatcher() {

                    @Override
                    public void beforeTextChanged(
                            CharSequence s,
                            int start,
                            int count,
                            int after
                    ) {
                    }

                    @Override
                    public void onTextChanged(
                            CharSequence s,
                            int start,
                            int before,
                            int count
                    ) {
                        adapter.filter(s.toString());
                    }

                    @Override
                    public void afterTextChanged(
                            android.text.Editable s
                    ) {
                    }
                }
        );

        boolean admin =
                "ADMIN".equalsIgnoreCase(
                        new SessionManager(requireContext()).role()
                );

        boolean crud =
                admin && isCrudResource(resource);

        adapter.setActions(
                new JsonRecordAdapter.Actions() {

                    @Override
                    public void onEdit(JsonObject item) {
                        showEditDialog(item);
                    }

                    @Override
                    public void onDelete(JsonObject item) {
                        confirmDelete(item);
                    }
                },
                crud
        );

        ExtendedFloatingActionButton add =
                view.findViewById(R.id.add_record);

        if (crud) {

            add.setVisibility(View.VISIBLE);

            add.setText(
                    "Add " + singular(title)
            );

            add.setOnClickListener(
                    v -> showCreateDialog()
            );
        }

        ExtendedFloatingActionButton mark =
                view.findViewById(R.id.add_attendance);

        if (canMark) {

            mark.setVisibility(View.VISIBLE);

            mark.setOnClickListener(
                    v -> showAttendanceDialog()
            );
        }

        load();

        return view;
    }

    private boolean isCrudResource(String key) {

        return "students".equals(key)
                || "teachers".equals(key)
                || "parents".equals(key)
                || "classes".equals(key)
                || "subjects".equals(key);
    }

    private String singular(String value) {

        if (value == null || value.isEmpty()) {
            return "Record";
        }

        return value.endsWith("s")
                ? value.substring(0, value.length() - 1)
                : value;
    }

    private void load() {

        status.setText("Loading live records…");

        RetrofitClient
                .get(requireContext())
                .records(resource, 1, 100, "")
                .enqueue(
                        new Callback<ApiEnvelope<PaginatedData>>() {

                            @Override
                            public void onResponse(
                                    Call<ApiEnvelope<PaginatedData>> call,
                                    Response<ApiEnvelope<PaginatedData>> response
                            ) {

                                if (
                                        response.isSuccessful()
                                                && response.body() != null
                                                && response.body().success
                                                && response.body().data != null
                                ) {

                                    adapter.setItems(
                                            response.body().data.items
                                    );

                                    int total =
                                            response.body().data.pagination == null
                                                    ? adapter.getItemCount()
                                                    : response.body()
                                                    .data
                                                    .pagination
                                                    .total;

                                    status.setText(
                                            total == 0
                                                    ? "No records are available."
                                                    : total
                                                    + " live record"
                                                    + (total == 1 ? "" : "s")
                                    );

                                } else {

                                    status.setText(
                                            "This register could not be loaded."
                                    );
                                }
                            }

                            @Override
                            public void onFailure(
                                    Call<ApiEnvelope<PaginatedData>> call,
                                    Throwable error
                            ) {

                                status.setText(
                                        "Network error. Check the API address and connection."
                                );
                            }
                        }
                );
    }

    private LinearLayout formLayout() {

        LinearLayout form =
                new LinearLayout(requireContext());

        form.setOrientation(
                LinearLayout.VERTICAL
        );

        form.setPadding(
                36,
                8,
                36,
                8
        );

        return form;
    }

    private EditText field(
            LinearLayout form,
            String hint,
            String value,
            boolean password
    ) {

        EditText input =
                new EditText(requireContext());

        input.setHint(hint);

        input.setText(
                value == null ? "" : value
        );

        input.setTextSize(16);

        input.setSingleLine(true);

        if (password) {

            input.setInputType(
                    InputType.TYPE_CLASS_TEXT
                            | InputType.TYPE_TEXT_VARIATION_PASSWORD
            );
        }

        form.addView(
                input,
                new LinearLayout.LayoutParams(
                        -1,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                )
        );

        return input;
    }

    private Spinner spinner(
            LinearLayout form,
            String[] values,
            String selected
    ) {

        Spinner spinner =
                new Spinner(requireContext());

        spinner.setAdapter(
                new ArrayAdapter<>(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        values
                )
        );

        if (selected != null) {

            for (int i = 0; i < values.length; i++) {

                if (
                        values[i].equalsIgnoreCase(selected)
                ) {

                    spinner.setSelection(i);
                    break;
                }
            }
        }

        form.addView(
                spinner,
                new LinearLayout.LayoutParams(
                        -1,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                )
        );

        return spinner;
    }

    private ScrollView scroll(
            LinearLayout form
    ) {

        ScrollView scroll =
                new ScrollView(requireContext());

        scroll.addView(form);

        return scroll;
    }

    private void showCreateDialog() {

        LinearLayout form =
                formLayout();

        EditText first = null;
        EditText last = null;
        EditText password = null;
        EditText email = null;
        EditText code = null;
        EditText name = null;
        EditText extra = null;

        Spinner gender = null;

        if (resource.equals("students")) {

            EditText roll =
                    field(
                            form,
                            "Roll number *",
                            "",
                            false
                    );

            first =
                    field(
                            form,
                            "First name *",
                            "",
                            false
                    );

            last =
                    field(
                            form,
                            "Last name *",
                            "",
                            false
                    );

            gender =
                    spinner(
                            form,
                            new String[]{
                                    "MALE",
                                    "FEMALE",
                                    "OTHER"
                            },
                            "MALE"
                    );

            EditText dob =
                    field(
                            form,
                            "Date of birth (YYYY-MM-DD) *",
                            "2008-01-01",
                            false
                    );

            field(
                    form,
                    "Phone",
                    "",
                    false
            );

            field(
                    form,
                    "Address",
                    "",
                    false
            );

            field(
                    form,
                    "Class ID (optional)",
                    "",
                    false
            );

            field(
                    form,
                    "Parent ID (optional)",
                    "",
                    false
            );

            password =
                    field(
                            form,
                            "Password *",
                            "Student123!",
                            true
                    );

            addCreateButton(
                    form,
                    "student_roll",
                    roll
            );

            addCreateButton(
                    form,
                    "student_dob",
                    dob
            );

        } else if (resource.equals("teachers")) {

            email =
                    field(
                            form,
                            "Email *",
                            "",
                            false
                    );

            password =
                    field(
                            form,
                            "Password *",
                            "Teacher123!",
                            true
                    );

            field(
                    form,
                    "Employee ID *",
                    "",
                    false
            );

            first =
                    field(
                            form,
                            "First name *",
                            "",
                            false
                    );

            last =
                    field(
                            form,
                            "Last name *",
                            "",
                            false
                    );

            field(
                    form,
                    "Phone",
                    "",
                    false
            );

            field(
                    form,
                    "Qualification",
                    "",
                    false
            );

        } else if (resource.equals("parents")) {

            email =
                    field(
                            form,
                            "Email *",
                            "",
                            false
                    );

            password =
                    field(
                            form,
                            "Password *",
                            "Parent123!",
                            true
                    );

            first =
                    field(
                            form,
                            "First name *",
                            "",
                            false
                    );

            last =
                    field(
                            form,
                            "Last name *",
                            "",
                            false
                    );

            field(
                    form,
                    "Phone",
                    "",
                    false
            );

            field(
                    form,
                    "Address",
                    "",
                    false
            );

        } else if (resource.equals("classes")) {

            name =
                    field(
                            form,
                            "Class name *",
                            "",
                            false
                    );

            code =
                    field(
                            form,
                            "Code *",
                            "",
                            false
                    );

            field(
                    form,
                    "Section",
                    "",
                    false
            );

            field(
                    form,
                    "Academic year *",
                    "2026-2027",
                    false
            );

            field(
                    form,
                    "Capacity",
                    "40",
                    false
            );

        } else if (resource.equals("subjects")) {

            name =
                    field(
                            form,
                            "Subject name *",
                            "",
                            false
                    );

            code =
                    field(
                            form,
                            "Code *",
                            "",
                            false
                    );

            extra =
                    field(
                            form,
                            "Description",
                            "",
                            false
                    );
        }

        AlertDialog dialog =
                new AlertDialog.Builder(requireContext())
                        .setTitle(
                                "Register " + singular(title)
                        )
                        .setView(
                                scroll(form)
                        )
                        .setNegativeButton(
                                "Cancel",
                                null
                        )
                        .setPositiveButton(
                                "Save",
                                null
                        )
                        .create();

        /*
         * IMPORTANT FIX:
         *
         * gender is assigned before the lambda.
         * Java requires variables captured by a lambda
         * to be final or effectively final.
         */
        final Spinner selectedGender = gender;

        dialog.setOnShowListener(
                v -> dialog
                        .getButton(
                                AlertDialog.BUTTON_POSITIVE
                        )
                        .setOnClickListener(
                                b -> {

                                    JsonObject body =
                                            new JsonObject();

                                    boolean valid =
                                            buildCreateBody(
                                                    body,
                                                    form,
                                                    selectedGender
                                            );

                                    if (!valid) {
                                        return;
                                    }

                                    RetrofitClient
                                            .get(requireContext())
                                            .create(
                                                    resource,
                                                    body
                                            )
                                            .enqueue(
                                                    new Callback<ApiEnvelope<JsonObject>>() {

                                                        @Override
                                                        public void onResponse(
                                                                Call<ApiEnvelope<JsonObject>> call,
                                                                Response<ApiEnvelope<JsonObject>> response
                                                        ) {

                                                            if (
                                                                    response.isSuccessful()
                                                                            && response.body() != null
                                                                            && response.body().success
                                                            ) {

                                                                dialog.dismiss();

                                                                Toast.makeText(
                                                                        requireContext(),
                                                                        singular(title)
                                                                                + " registered successfully.",
                                                                        Toast.LENGTH_SHORT
                                                                ).show();

                                                                load();

                                                            } else {

                                                                Toast.makeText(
                                                                        requireContext(),
                                                                        "Could not register this record. Check required fields.",
                                                                        Toast.LENGTH_LONG
                                                                ).show();
                                                            }
                                                        }

                                                        @Override
                                                        public void onFailure(
                                                                Call<ApiEnvelope<JsonObject>> call,
                                                                Throwable t
                                                        ) {

                                                            Toast.makeText(
                                                                    requireContext(),
                                                                    "Network error while registering.",
                                                                    Toast.LENGTH_SHORT
                                                            ).show();
                                                        }
                                                    }
                                            );
                                }
                        )
        );

        dialog.show();
    }

    private void addCreateButton(
            LinearLayout form,
            String tag,
            EditText input
    ) {

        input.setTag(tag);
    }

    private boolean buildCreateBody(
            JsonObject body,
            LinearLayout form,
            Spinner gender
    ) {

        java.util.List<EditText> inputs =
                new java.util.ArrayList<>();

        collectInputs(
                form,
                inputs
        );

        if (resource.equals("students")) {

            String roll =
                    tagValue(
                            inputs,
                            "student_roll"
                    );

            String dob =
                    tagValue(
                            inputs,
                            "student_dob"
                    );

            if (
                    roll.isEmpty()
                            || dob.isEmpty()
                            || textAt(inputs, 1).isEmpty()
                            || textAt(inputs, 2).isEmpty()
            ) {

                return false;
            }

            body.addProperty(
                    "rollNumber",
                    roll
            );

            body.addProperty(
                    "firstName",
                    textAt(inputs, 1)
            );

            body.addProperty(
                    "lastName",
                    textAt(inputs, 2)
            );

            if (gender != null) {

                body.addProperty(
                        "gender",
                        gender.getSelectedItem().toString()
                );
            }

            body.addProperty(
                    "dateOfBirth",
                    dob
            );

            if (!textAt(inputs, 4).isEmpty()) {

                body.addProperty(
                        "phone",
                        textAt(inputs, 4)
                );
            }

            if (!textAt(inputs, 5).isEmpty()) {

                body.addProperty(
                        "address",
                        textAt(inputs, 5)
                );
            }

            if (!textAt(inputs, 6).isEmpty()) {

                body.addProperty(
                        "classId",
                        textAt(inputs, 6)
                );
            }

            if (!textAt(inputs, 7).isEmpty()) {

                body.addProperty(
                        "parentId",
                        textAt(inputs, 7)
                );
            }

            body.addProperty(
                    "password",
                    textAt(inputs, 8)
            );

            return !textAt(inputs, 8).isEmpty();
        }

        if (resource.equals("teachers")) {

            if (inputs.size() < 7) {
                return false;
            }

            body.addProperty(
                    "email",
                    textAt(inputs, 0)
            );

            body.addProperty(
                    "password",
                    textAt(inputs, 1)
            );

            body.addProperty(
                    "employeeId",
                    textAt(inputs, 2)
            );

            body.addProperty(
                    "firstName",
                    textAt(inputs, 3)
            );

            body.addProperty(
                    "lastName",
                    textAt(inputs, 4)
            );

            if (!textAt(inputs, 5).isEmpty()) {

                body.addProperty(
                        "phone",
                        textAt(inputs, 5)
                );
            }

            if (!textAt(inputs, 6).isEmpty()) {

                body.addProperty(
                        "qualification",
                        textAt(inputs, 6)
                );
            }

            return !textAt(inputs, 0).isEmpty()
                    && !textAt(inputs, 1).isEmpty()
                    && !textAt(inputs, 2).isEmpty()
                    && !textAt(inputs, 3).isEmpty()
                    && !textAt(inputs, 4).isEmpty();
        }

        if (resource.equals("parents")) {

            body.addProperty(
                    "email",
                    textAt(inputs, 0)
            );

            body.addProperty(
                    "password",
                    textAt(inputs, 1)
            );

            body.addProperty(
                    "firstName",
                    textAt(inputs, 2)
            );

            body.addProperty(
                    "lastName",
                    textAt(inputs, 3)
            );

            if (!textAt(inputs, 4).isEmpty()) {

                body.addProperty(
                        "phone",
                        textAt(inputs, 4)
                );
            }

            if (!textAt(inputs, 5).isEmpty()) {

                body.addProperty(
                        "address",
                        textAt(inputs, 5)
                );
            }

            return !textAt(inputs, 0).isEmpty()
                    && !textAt(inputs, 1).isEmpty()
                    && !textAt(inputs, 2).isEmpty()
                    && !textAt(inputs, 3).isEmpty();
        }

        if (resource.equals("classes")) {

            body.addProperty(
                    "name",
                    textAt(inputs, 0)
            );

            body.addProperty(
                    "code",
                    textAt(inputs, 1)
            );

            if (!textAt(inputs, 2).isEmpty()) {

                body.addProperty(
                        "section",
                        textAt(inputs, 2)
                );
            }

            body.addProperty(
                    "academicYear",
                    textAt(inputs, 3)
            );

            body.addProperty(
                    "capacity",
                    parseInt(
                            textAt(inputs, 4),
                            40
                    )
            );

            return !textAt(inputs, 0).isEmpty()
                    && !textAt(inputs, 1).isEmpty()
                    && !textAt(inputs, 3).isEmpty();
        }

        if (resource.equals("subjects")) {

            body.addProperty(
                    "name",
                    textAt(inputs, 0)
            );

            body.addProperty(
                    "code",
                    textAt(inputs, 1)
            );

            if (!textAt(inputs, 2).isEmpty()) {

                body.addProperty(
                        "description",
                        textAt(inputs, 2)
                );
            }

            return !textAt(inputs, 0).isEmpty()
                    && !textAt(inputs, 1).isEmpty();
        }

        return false;
    }

    private void collectInputs(
            ViewGroup group,
            java.util.List<EditText> out
    ) {

        for (
                int i = 0;
                i < group.getChildCount();
                i++
        ) {

            View v =
                    group.getChildAt(i);

            if (v instanceof EditText) {

                out.add(
                        (EditText) v
                );

            } else if (v instanceof ViewGroup) {

                collectInputs(
                        (ViewGroup) v,
                        out
                );
            }
        }
    }

    private String textAt(
            java.util.List<EditText> list,
            int i
    ) {

        return i >= list.size()
                ? ""
                : list.get(i)
                .getText()
                .toString()
                .trim();
    }

    private String tagValue(
            java.util.List<EditText> list,
            String tag
    ) {

        for (EditText e : list) {

            if (tag.equals(e.getTag())) {

                return e.getText()
                        .toString()
                        .trim();
            }
        }

        return "";
    }

    private int parseInt(
            String s,
            int fallback
    ) {

        try {

            return Integer.parseInt(s);

        } catch (Exception e) {

            return fallback;
        }
    }

    private void showEditDialog(
            JsonObject item
    ) {

        String id =
                string(
                        item,
                        "id"
                );

        if (id.isEmpty()) {

            Toast.makeText(
                    requireContext(),
                    "This record has no ID.",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }

        LinearLayout form =
                formLayout();

        java.util.List<String> keys =
                new java.util.ArrayList<>();

        if (resource.equals("students")) {

            keys = listOf(
                    "firstName",
                    "lastName",
                    "phone",
                    "address",
                    "classId",
                    "parentId"
            );

        } else if (resource.equals("teachers")) {

            keys = listOf(
                    "firstName",
                    "lastName",
                    "phone",
                    "qualification",
                    "profileImage"
            );

        } else if (resource.equals("parents")) {

            keys = listOf(
                    "firstName",
                    "lastName",
                    "phone",
                    "address"
            );

        } else if (resource.equals("classes")) {

            keys = listOf(
                    "name",
                    "code",
                    "section",
                    "academicYear",
                    "capacity"
            );

        } else if (resource.equals("subjects")) {

            keys = listOf(
                    "name",
                    "code",
                    "description"
            );
        }

        for (String key : keys) {

            field(
                    form,
                    pretty(key),
                    string(item, key),
                    false
            ).setTag(key);
        }

        AlertDialog dialog =
                new AlertDialog.Builder(requireContext())
                        .setTitle(
                                "Edit " + singular(title)
                        )
                        .setView(
                                scroll(form)
                        )
                        .setNegativeButton(
                                "Cancel",
                                null
                        )
                        .setPositiveButton(
                                "Save changes",
                                null
                        )
                        .create();

        dialog.setOnShowListener(
                v -> dialog
                        .getButton(
                                AlertDialog.BUTTON_POSITIVE
                        )
                        .setOnClickListener(
                                b -> {

                                    JsonObject body =
                                            new JsonObject();

                                    for (
                                            int i = 0;
                                            i < form.getChildCount();
                                            i++
                                    ) {

                                        View child =
                                                form.getChildAt(i);

                                        if (
                                                child instanceof EditText
                                                        && child.getTag() != null
                                        ) {

                                            String key =
                                                    String.valueOf(
                                                            child.getTag()
                                                    );

                                            String val =
                                                    ((EditText) child)
                                                            .getText()
                                                            .toString()
                                                            .trim();

                                            if (
                                                    key.equals("capacity")
                                            ) {

                                                body.addProperty(
                                                        key,
                                                        parseInt(
                                                                val,
                                                                40
                                                        )
                                                );

                                            } else {

                                                body.addProperty(
                                                        key,
                                                        val.isEmpty()
                                                                ? null
                                                                : val
                                                );
                                            }
                                        }
                                    }

                                    RetrofitClient
                                            .get(requireContext())
                                            .update(
                                                    resource,
                                                    id,
                                                    body
                                            )
                                            .enqueue(
                                                    new Callback<ApiEnvelope<JsonObject>>() {

                                                        @Override
                                                        public void onResponse(
                                                                Call<ApiEnvelope<JsonObject>> call,
                                                                Response<ApiEnvelope<JsonObject>> response
                                                        ) {

                                                            if (
                                                                    response.isSuccessful()
                                                                            && response.body() != null
                                                                            && response.body().success
                                                            ) {

                                                                dialog.dismiss();

                                                                Toast.makeText(
                                                                        requireContext(),
                                                                        "Changes saved.",
                                                                        Toast.LENGTH_SHORT
                                                                ).show();

                                                                load();

                                                            } else {

                                                                Toast.makeText(
                                                                        requireContext(),
                                                                        "Could not save changes.",
                                                                        Toast.LENGTH_SHORT
                                                                ).show();
                                                            }
                                                        }

                                                        @Override
                                                        public void onFailure(
                                                                Call<ApiEnvelope<JsonObject>> call,
                                                                Throwable t
                                                        ) {

                                                            Toast.makeText(
                                                                    requireContext(),
                                                                    "Network error while editing.",
                                                                    Toast.LENGTH_SHORT
                                                            ).show();
                                                        }
                                                    }
                                            );
                                }
                        )
        );

        dialog.show();
    }

    private void confirmDelete(
            JsonObject item
    ) {

        String id =
                string(
                        item,
                        "id"
                );

        new AlertDialog.Builder(requireContext())
                .setTitle(
                        "Delete " + singular(title) + "?"
                )
                .setMessage(
                        "This record will be permanently removed from the school system."
                )
                .setNegativeButton(
                        "Cancel",
                        null
                )
                .setPositiveButton(
                        "Delete",
                        (d, w) -> {

                            RetrofitClient
                                    .get(requireContext())
                                    .delete(
                                            resource,
                                            id
                                    )
                                    .enqueue(
                                            new Callback<Void>() {

                                                @Override
                                                public void onResponse(
                                                        Call<Void> call,
                                                        Response<Void> response
                                                ) {

                                                    if (
                                                            response.isSuccessful()
                                                    ) {

                                                        Toast.makeText(
                                                                requireContext(),
                                                                "Record deleted.",
                                                                Toast.LENGTH_SHORT
                                                        ).show();

                                                        load();

                                                    } else {

                                                        Toast.makeText(
                                                                requireContext(),
                                                                "Delete failed. Only authorized admins can delete.",
                                                                Toast.LENGTH_SHORT
                                                        ).show();
                                                    }
                                                }

                                                @Override
                                                public void onFailure(
                                                        Call<Void> call,
                                                        Throwable t
                                                ) {

                                                    Toast.makeText(
                                                            requireContext(),
                                                            "Network error while deleting.",
                                                            Toast.LENGTH_SHORT
                                                    ).show();
                                                }
                                            }
                                    );
                        }
                )
                .show();
    }

    private String string(
            JsonObject o,
            String key
    ) {

        return o.has(key)
                && o.get(key).isJsonPrimitive()
                ? o.get(key).getAsString()
                : "";
    }

    private String pretty(
            String key
    ) {

        String s =
                key.replaceAll(
                        "([A-Z])",
                        " $1"
                );

        return Character.toUpperCase(
                s.charAt(0)
        ) + s.substring(1);
    }

    private java.util.List<String> listOf(
            String... values
    ) {

        return new java.util.ArrayList<>(
                java.util.Arrays.asList(values)
        );
    }

    private void showAttendanceDialog() {

        View form =
                LayoutInflater
                        .from(requireContext())
                        .inflate(
                                R.layout.dialog_attendance,
                                null
                        );

        TextInputEditText student =
                form.findViewById(
                        R.id.attendance_student_id
                );

        TextInputEditText classId =
                form.findViewById(
                        R.id.attendance_class_id
                );

        TextInputEditText date =
                form.findViewById(
                        R.id.attendance_date
                );

        date.setText(
                new SimpleDateFormat(
                        "yyyy-MM-dd",
                        Locale.US
                ).format(
                        new Date()
                )
        );

        Spinner spinner =
                form.findViewById(
                        R.id.attendance_status
                );

        spinner.setAdapter(
                new ArrayAdapter<>(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        new String[]{
                                "PRESENT",
                                "ABSENT",
                                "LATE",
                                "EXCUSED"
                        }
                )
        );

        AlertDialog dialog =
                new AlertDialog.Builder(requireContext())
                        .setTitle(
                                "Mark attendance"
                        )
                        .setView(form)
                        .setNegativeButton(
                                "Cancel",
                                null
                        )
                        .setPositiveButton(
                                "Save",
                                null
                        )
                        .create();

        dialog.setOnShowListener(
                v -> dialog
                        .getButton(
                                AlertDialog.BUTTON_POSITIVE
                        )
                        .setOnClickListener(
                                b -> saveAttendance(
                                        dialog,
                                        student,
                                        classId,
                                        date,
                                        spinner
                                )
                        )
        );

        dialog.show();
    }

    private void saveAttendance(
            AlertDialog dialog,
            TextInputEditText student,
            TextInputEditText classId,
            TextInputEditText date,
            Spinner spinner
    ) {

        String studentId =
                text(student);

        String groupId =
                text(classId);

        String day =
                text(date);

        if (
                studentId.isEmpty()
                        || day.isEmpty()
        ) {

            Toast.makeText(
                    requireContext(),
                    "Student ID and date are required.",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }

        JsonObject body =
                new JsonObject();

        body.addProperty(
                "studentId",
                studentId
        );

        if (!groupId.isEmpty()) {

            body.addProperty(
                    "classId",
                    groupId
            );
        }

        body.addProperty(
                "date",
                day
        );

        body.addProperty(
                "status",
                spinner
                        .getSelectedItem()
                        .toString()
        );

        RetrofitClient
                .get(requireContext())
                .create(
                        "attendance",
                        body
                )
                .enqueue(
                        new Callback<ApiEnvelope<JsonObject>>() {

                            @Override
                            public void onResponse(
                                    Call<ApiEnvelope<JsonObject>> call,
                                    Response<ApiEnvelope<JsonObject>> response
                            ) {

                                if (
                                        response.isSuccessful()
                                                && response.body() != null
                                                && response.body().success
                                ) {

                                    dialog.dismiss();

                                    Toast.makeText(
                                            requireContext(),
                                            "Attendance saved.",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    load();

                                } else {

                                    Toast.makeText(
                                            requireContext(),
                                            "Attendance could not be saved.",
                                            Toast.LENGTH_SHORT
                                    ).show();
                                }
                            }

                            @Override
                            public void onFailure(
                                    Call<ApiEnvelope<JsonObject>> call,
                                    Throwable error
                            ) {

                                Toast.makeText(
                                        requireContext(),
                                        "Network error while saving attendance.",
                                        Toast.LENGTH_SHORT
                                ).show();
                            }
                        }
                );
    }

    private String text(
            TextInputEditText input
    ) {

        return input.getText() == null
                ? ""
                : input.getText()
                .toString()
                .trim();
    }
}