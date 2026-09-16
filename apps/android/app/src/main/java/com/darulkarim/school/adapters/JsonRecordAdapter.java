package com.darulkarim.school.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.darulkarim.school.R;
import com.google.android.material.button.MaterialButton;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class JsonRecordAdapter extends RecyclerView.Adapter<JsonRecordAdapter.Holder> {
    public interface Actions {
        void onEdit(JsonObject item);
        void onDelete(JsonObject item);
    }

    private final List<JsonObject> all = new ArrayList<>();
    private final List<JsonObject> visible = new ArrayList<>();
    private Actions actions;
    private boolean showActions;

    public void setActions(Actions actions, boolean showActions) {
        this.actions = actions;
        this.showActions = showActions;
        notifyDataSetChanged();
    }

    public void setItems(JsonArray items) {
        all.clear();
        if (items != null) {
            for (JsonElement element : items) {
                if (element.isJsonObject()) all.add(element.getAsJsonObject());
            }
        }
        filter("");
    }

    public void filter(String query) {
        visible.clear();
        String needle = query.toLowerCase().trim();
        for (JsonObject item : all) {
            if (needle.isEmpty() || item.toString().toLowerCase().contains(needle)) visible.add(item);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new Holder(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_card, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull Holder holder, int position) {
        JsonObject item = visible.get(position);
        holder.title.setText(title(item));
        holder.detail.setText(detail(item));
        holder.actions.setVisibility(showActions ? View.VISIBLE : View.GONE);
        if (showActions && actions != null) {
            holder.edit.setOnClickListener(v -> actions.onEdit(item));
            holder.delete.setOnClickListener(v -> actions.onDelete(item));
        } else {
            holder.edit.setOnClickListener(null);
            holder.delete.setOnClickListener(null);
        }
    }

    @Override
    public int getItemCount() { return visible.size(); }

    private String title(JsonObject item) {
        for (String key : new String[]{"label", "title", "name", "subject", "rollNumber", "employeeId", "code", "key"}) {
            if (item.has(key) && item.get(key).isJsonPrimitive()) return item.get(key).getAsString();
        }
        if (item.has("firstName")) return item.get("firstName").getAsString() + " " + (item.has("lastName") ? item.get("lastName").getAsString() : "");
        return "School record";
    }

    private String detail(JsonObject item) {
        StringBuilder value = new StringBuilder();
        for (Map.Entry<String, JsonElement> entry : item.entrySet()) {
            String key = entry.getKey();
            if (key.equals("id") || key.equals("title") || key.equals("name") || key.equals("label") || key.equals("firstName") || key.equals("lastName")) continue;
            if (entry.getValue().isJsonPrimitive()) {
                if (value.length() > 0) value.append(" · ");
                value.append(key.replaceAll("([A-Z])", " $1")).append(": ").append(entry.getValue().getAsString());
            }
            if (value.length() > 180) break;
        }
        return value.length() == 0 ? "Open for full record details." : value.toString();
    }

    static class Holder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView detail;
        final LinearLayout actions;
        final MaterialButton edit;
        final MaterialButton delete;

        Holder(View view) {
            super(view);
            title = view.findViewById(R.id.item_title);
            detail = view.findViewById(R.id.item_detail);
            actions = view.findViewById(R.id.item_actions);
            edit = view.findViewById(R.id.button_edit);
            delete = view.findViewById(R.id.button_delete);
        }
    }
}
