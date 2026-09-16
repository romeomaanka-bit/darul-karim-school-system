package com.darulkarim.school.models;

public class ApiEnvelope<T> {
    public boolean success;
    public T data;
    public String message;
}
