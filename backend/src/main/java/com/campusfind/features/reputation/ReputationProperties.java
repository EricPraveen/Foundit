package com.campusfind.features.reputation;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.reputation")
public class ReputationProperties {

    private boolean enabled = true;
    private int defaultHandoverPoints = 10;
    private int defaultCollectionPoints = 0;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getDefaultHandoverPoints() {
        return defaultHandoverPoints;
    }

    public void setDefaultHandoverPoints(int defaultHandoverPoints) {
        this.defaultHandoverPoints = defaultHandoverPoints;
    }

    public int getDefaultCollectionPoints() {
        return defaultCollectionPoints;
    }

    public void setDefaultCollectionPoints(int defaultCollectionPoints) {
        this.defaultCollectionPoints = defaultCollectionPoints;
    }
}
