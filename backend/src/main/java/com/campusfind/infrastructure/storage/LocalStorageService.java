package com.campusfind.infrastructure.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private final Path rootDir;

    public LocalStorageService(String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            log.error("Could not initialize local storage directory at {}", this.rootDir, e);
        }
    }

    @Override
    public StoredFile upload(String bucket, String path, byte[] bytes, String contentType) {
        try {
            Path targetPath = rootDir.resolve(bucket).resolve(path).normalize();
            if (!targetPath.startsWith(rootDir)) {
                throw new IllegalArgumentException("Invalid file storage path traversal");
            }
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            String publicUrl = "/api/v1/storage/" + bucket + "/" + path;
            return new StoredFile(path, publicUrl, contentType, bytes.length);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally: " + path, e);
        }
    }

    @Override
    public void delete(String bucket, String path) {
        try {
            Path targetPath = rootDir.resolve(bucket).resolve(path).normalize();
            if (targetPath.startsWith(rootDir)) {
                Files.deleteIfExists(targetPath);
            }
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", path, e);
        }
    }

    @Override
    public byte[] download(String bucket, String path) {
        try {
            Path targetPath = rootDir.resolve(bucket).resolve(path).normalize();
            if (!targetPath.startsWith(rootDir) || !Files.exists(targetPath)) {
                throw new RuntimeException("File not found in local storage: " + path);
            }
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read local storage file: " + path, e);
        }
    }

    @Override
    public String getPublicUrl(String bucket, String path) {
        return "/api/v1/storage/" + bucket + "/" + path;
    }
}
