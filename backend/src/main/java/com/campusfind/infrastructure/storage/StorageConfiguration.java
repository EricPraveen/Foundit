package com.campusfind.infrastructure.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfiguration {

    private static final Logger log = LoggerFactory.getLogger(StorageConfiguration.class);

    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "supabase")
    public StorageService supabaseStorageService(
            @Value("${app.storage.supabase.url:${SUPABASE_URL:https://peozkhpdwvrctmqroqau.supabase.co}}") String supabaseUrl,
            @Value("${app.storage.supabase.service-role-key:${SUPABASE_SERVICE_ROLE_KEY:}}") String serviceRoleKey) {
        log.info("Initializing SupabaseStorageService with endpoint: {}", supabaseUrl);
        return new SupabaseStorageService(supabaseUrl, serviceRoleKey);
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
    public StorageService localStorageService(
            @Value("${app.storage.local.upload-dir:uploads/found-items}") String uploadDir) {
        log.info("Initializing LocalStorageService with directory: {}", uploadDir);
        return new LocalStorageService(uploadDir);
    }
}
