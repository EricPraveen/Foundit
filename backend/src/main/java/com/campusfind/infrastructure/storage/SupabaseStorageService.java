package com.campusfind.infrastructure.storage;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SupabaseStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final HttpClient httpClient;

    public SupabaseStorageService(String supabaseUrl, String serviceRoleKey) {
        this.supabaseUrl = (supabaseUrl != null && supabaseUrl.endsWith("/")) 
                ? supabaseUrl.substring(0, supabaseUrl.length() - 1) 
                : supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public StoredFile upload(String bucket, String path, byte[] bytes, String contentType) {
        String uploadEndpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, path);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadEndpoint))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .header("Content-Type", contentType)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String publicUrl = getPublicUrl(bucket, path);
                return new StoredFile(path, publicUrl, contentType, bytes.length);
            } else {
                log.error("Supabase storage upload failed with status {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Supabase storage upload failed: " + response.body());
            }
        } catch (Exception e) {
            log.error("Exception uploading file to Supabase Storage: {}", path, e);
            throw new RuntimeException("Storage upload exception: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String bucket, String path) {
        String deleteEndpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, path);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(deleteEndpoint))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .DELETE()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            log.warn("Failed to delete file from Supabase storage: {}", path, e);
        }
    }

    @Override
    public String getPublicUrl(String bucket, String path) {
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucket, path);
    }
}
