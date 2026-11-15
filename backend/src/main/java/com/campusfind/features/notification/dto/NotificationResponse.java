package com.campusfind.features.notification.dto;

import com.campusfind.domain.notification.NotificationEntityType;
import com.campusfind.domain.notification.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType notificationType,
        String title,
        String message,
        NotificationEntityType relatedEntityType,
        UUID relatedEntityId,
        boolean isRead,
        Instant readAt,
        Instant createdAt
) {}
