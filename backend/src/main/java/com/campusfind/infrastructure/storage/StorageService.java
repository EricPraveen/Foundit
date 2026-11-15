package com.campusfind.infrastructure.storage;

public interface StorageService {

    StoredFile upload(String bucket, String path, byte[] bytes, String contentType);

    void delete(String bucket, String path);

    byte[] download(String bucket, String path);

    String getPublicUrl(String bucket, String path);
}
