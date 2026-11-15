package com.campusfind.features.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.notification")
public class NotificationProperties {

    private boolean emailEnabled = true;
    private int maxEmailRetries = 3;
    private int emailRetryDelaySeconds = 300;
    private boolean unclaimedEnabled = false;
    private int unclaimedThresholdDays = 30;
    private String baseUrl = "http://localhost:5173";

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public int getMaxEmailRetries() {
        return maxEmailRetries;
    }

    public void setMaxEmailRetries(int maxEmailRetries) {
        this.maxEmailRetries = maxEmailRetries;
    }

    public int getEmailRetryDelaySeconds() {
        return emailRetryDelaySeconds;
    }

    public void setEmailRetryDelaySeconds(int emailRetryDelaySeconds) {
        this.emailRetryDelaySeconds = emailRetryDelaySeconds;
    }

    public boolean isUnclaimedEnabled() {
        return unclaimedEnabled;
    }

    public void setUnclaimedEnabled(boolean unclaimedEnabled) {
        this.unclaimedEnabled = unclaimedEnabled;
    }

    public int getUnclaimedThresholdDays() {
        return unclaimedThresholdDays;
    }

    public void setUnclaimedThresholdDays(int unclaimedThresholdDays) {
        this.unclaimedThresholdDays = unclaimedThresholdDays;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
}
