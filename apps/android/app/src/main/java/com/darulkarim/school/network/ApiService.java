package com.darulkarim.school.network;

import com.darulkarim.school.models.ApiEnvelope;
import com.darulkarim.school.models.DashboardData;
import com.darulkarim.school.models.LoginRequest;
import com.darulkarim.school.models.LoginResponse;
import com.darulkarim.school.models.PaginatedData;
import com.google.gson.JsonObject;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;
import retrofit2.http.DELETE;

public interface ApiService {
    @POST("auth/login") Call<ApiEnvelope<LoginResponse>> login(@Body LoginRequest request);
    @POST("auth/logout") Call<ApiEnvelope<JsonObject>> logout();
    @GET("auth/me") Call<ApiEnvelope<LoginResponse.User>> me();
    @GET("dashboard") Call<ApiEnvelope<DashboardData>> dashboard();
    @GET("{resource}") Call<ApiEnvelope<PaginatedData>> records(@Path("resource") String resource, @Query("page") int page, @Query("limit") int limit, @Query("search") String search);
    @POST("{resource}") Call<ApiEnvelope<JsonObject>> create(@Path("resource") String resource, @Body JsonObject body);
    @retrofit2.http.PUT("{resource}/{id}") Call<ApiEnvelope<JsonObject>> update(@Path("resource") String resource, @Path("id") String id, @Body JsonObject body);
    @DELETE("{resource}/{id}") Call<Void> delete(@Path("resource") String resource, @Path("id") String id);
    @PUT("notifications/{id}/read") Call<ApiEnvelope<JsonObject>> markNotificationRead(@Path("id") String id, @Body JsonObject body);
}
