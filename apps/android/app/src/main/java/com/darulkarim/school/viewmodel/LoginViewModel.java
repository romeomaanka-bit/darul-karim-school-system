package com.darulkarim.school.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.darulkarim.school.models.LoginResponse;
import com.darulkarim.school.repository.AuthRepository;

public class LoginViewModel extends AndroidViewModel {
    public static class State { public final boolean loading; public final LoginResponse result; public final String error; private State(boolean loading, LoginResponse result, String error) { this.loading = loading; this.result = result; this.error = error; } public static State loading() { return new State(true, null, null); } public static State success(LoginResponse value) { return new State(false, value, null); } public static State error(String message) { return new State(false, null, message); } }
    private final MutableLiveData<State> state = new MutableLiveData<>();
    private final AuthRepository repository;
    public LoginViewModel(@NonNull Application application) { super(application); repository = new AuthRepository(application); }
    public LiveData<State> state() { return state; }
    public void login(String identifier, String password) { state.setValue(State.loading()); repository.login(identifier, password, new AuthRepository.LoginCallback() { @Override public void onSuccess(LoginResponse response) { state.postValue(State.success(response)); } @Override public void onFailure(String message) { state.postValue(State.error(message)); } }); }
}
