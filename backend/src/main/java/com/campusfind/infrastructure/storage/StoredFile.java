package com.campusfind.infrastructure.storage;

public record StoredFile(
        String storagePath,
        String publicUrl,
        String contentType,
        long size
) {}
