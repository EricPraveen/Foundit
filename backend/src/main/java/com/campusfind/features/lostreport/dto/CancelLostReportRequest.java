package com.campusfind.features.lostreport.dto;

import jakarta.validation.constraints.Size;

public record CancelLostReportRequest(
        @Size(max = 1000, message = "Cancellation reason must not exceed 1000 characters")
        String cancellationReason
) {}
