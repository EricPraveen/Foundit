package com.campusfind.common.error;

public record ValidationError(String field, String message, Object rejectedValue) {}
