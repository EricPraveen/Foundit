package com.campusfind.features.notification;

import com.campusfind.features.notification.dto.NotificationResponse;
import com.campusfind.features.notification.dto.UnreadCountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "In-App Notifications", description = "Endpoints for students, officers, and administrators to retrieve and manage their personal in-app notifications")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "List my notifications", description = "Retrieves an auditable, paginated list of personal notifications for the authenticated user, newest first.")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponse> notifications = notificationService.getMyNotifications(principal.getName(), pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count", description = "Retrieves the count of unread notifications for badge indicators.")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Principal principal) {
        UnreadCountResponse response = notificationService.getUnreadCount(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark single notification as read", description = "Marks a specific notification as read. Idempotent and restricted to the notification owner.")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID notificationId,
            Principal principal) {
        NotificationResponse response = notificationService.markAsRead(notificationId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Marks all unread notifications belonging to the authenticated user as read.")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.noContent().build();
    }
}
