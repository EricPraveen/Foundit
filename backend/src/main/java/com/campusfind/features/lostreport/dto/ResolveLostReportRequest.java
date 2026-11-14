package com.campusfind.features.lostreport.dto;

import jakarta.validation.constraints.Size;

public record ResolveLostReportRequest(
        @Size(max = 1000, message = "Resolution notes must not exceed 1000 characters")
        String resolutionNotes
) {}
