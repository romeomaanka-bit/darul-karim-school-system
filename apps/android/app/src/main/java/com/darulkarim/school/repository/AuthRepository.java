package com.darulkarim.school.repository;

import android.content.Context;
import android.util.Log;

import com.darulkarim.school.models.ApiEnvelope;
import com.darulkarim.school.models.LoginRequest;
import com.darulkarim.school.models.LoginResponse;
import com.darulkarim.school.network.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AuthRepository {

    private static final String TAG = "DK_LOGIN";

    public interface LoginCallback {
        void onSuccess(LoginResponse response);
        void onFailure(String message);
    }

    private final Context context;

    public AuthRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    public void login(String identifier, String password, LoginCallback callback) {

        Log.d(TAG, "Login identifier: " + identifier);

        RetrofitClient.get(context)
                .login(new LoginRequest(identifier, password))
                .enqueue(new Callback<ApiEnvelope<LoginResponse>>() {

                    @Override
                    public void onResponse(
                            Call<ApiEnvelope<LoginResponse>> call,
                            Response<ApiEnvelope<LoginResponse>> response) {

                        Log.d(TAG, "HTTP CODE: " + response.code());
                        Log.d(TAG, "SUCCESS: " + response.isSuccessful());

                        ApiEnvelope<LoginResponse> body = response.body();

                        if (body != null) {
                            Log.d(TAG, "API success: " + body.success);
                            Log.d(TAG, "API message: " + body.message);
                            Log.d(TAG, "API data: " + (body.data != null));

                            if (body.data != null) {
                                Log.d(TAG, "Access token exists: "
                                        + (body.data.accessToken != null));
                                Log.d(TAG, "User exists: "
                                        + (body.data.user != null));
                            }
                        } else {
                            Log.e(TAG, "Response body is NULL");
                        }

                        if (response.isSuccessful()
                                && body != null
                                && body.success
                                && body.data != null) {

                            callback.onSuccess(body.data);

                        } else {

                            String message =
                                    body != null && body.message != null
                                            ? body.message
                                            : "Login failed. HTTP " + response.code();

                            Log.e(TAG, "LOGIN FAILED: " + message);

                            callback.onFailure(message);
                        }
                    }

                    @Override
                    public void onFailure(
                            Call<ApiEnvelope<LoginResponse>> call,
                            Throwable error) {

                        Log.e(TAG, "NETWORK/RETROFIT ERROR", error);

                        callback.onFailure(
                                "Network error: " +
                                (error.getMessage() != null
                                        ? error.getMessage()
                                        : error.getClass().getSimpleName())
                        );
                    }
                });
    }
}
