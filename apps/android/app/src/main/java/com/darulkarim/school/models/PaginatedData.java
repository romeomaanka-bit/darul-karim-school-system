package com.darulkarim.school.models;

import com.google.gson.JsonArray;
public class PaginatedData { public JsonArray items; public Pagination pagination; public static class Pagination { public int page; public int limit; public int total; public int pages; } }
