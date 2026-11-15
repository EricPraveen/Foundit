package com.campusfind.features.collection.dto;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ConfirmCollectionRequest(
        @Size(max = 1000, message = "Officer notes must not exceed 1000 characters")
        String officerNotes,

        UUID linkedLostReportId
) {}
