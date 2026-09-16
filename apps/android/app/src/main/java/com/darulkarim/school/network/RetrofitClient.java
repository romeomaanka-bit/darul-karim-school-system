package com.darulkarim.school.network;

import android.content.Context;
import com.darulkarim.school.BuildConfig;
import com.darulkarim.school.utils.SessionManager;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public final class RetrofitClient {
    private static ApiService service;
    private RetrofitClient() { }
    public static synchronized ApiService get(Context context) {
        if (service == null) {
            SessionManager session = new SessionManager(context.getApplicationContext());
            Interceptor auth = chain -> {
                okhttp3.Request.Builder request = chain.request().newBuilder().header("Accept", "application/json");
                if (session.token() != null) request.header("Authorization", "Bearer " + session.token());
                return chain.proceed(request.build());
            };
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(BuildConfig.DEBUG ? HttpLoggingInterceptor.Level.BASIC : HttpLoggingInterceptor.Level.NONE);
            OkHttpClient client = new OkHttpClient.Builder().addInterceptor(auth).addInterceptor(logging).build();
            service = new Retrofit.Builder().baseUrl(BuildConfig.API_BASE_URL).client(client).addConverterFactory(GsonConverterFactory.create()).build().create(ApiService.class);
        }
        return service;
    }
}
