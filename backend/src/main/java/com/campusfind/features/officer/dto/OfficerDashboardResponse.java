package com.campusfind.features.officer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Aggregated operational statistics and metrics for the Central Security Office dashboard")
public record OfficerDashboardResponse(
        @Schema(description = "Available items physically verified, received, and currently active in student listings")
        long availableItems,

        @Schema(description = "Found items awaiting physical handover confirmation by a Security Officer")
        long pendingHandovers,

        @Schema(description = "Ownership claims submitted by students awaiting Security Officer review")
        long pendingClaims,

        @Schema(description = "Approved claims awaiting physical collection by the verified claimant")
        long pendingCollection,

        @Schema(description = "Items whose physical collection has been confirmed and marked RETURNED")
        long returnedItems,

        @Schema(description = "Items that reached the unclaimed threshold without confirmed ownership")
        long unclaimedItems,

        @Schema(description = "Active private lost reports registered with the security office")
        long activeLostReports,

        @Schema(description = "Assigned security office ID (null for platform-wide admin view)")
        UUID officeId,

        @Schema(description = "Assigned security office name")
        String officeName
) {}
