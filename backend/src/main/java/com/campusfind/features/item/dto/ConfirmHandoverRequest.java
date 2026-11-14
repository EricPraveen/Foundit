package com.campusfind.features.item.dto;

import jakarta.validation.constraints.Size;

public record ConfirmHandoverRequest(
        @Size(max = 2000, message = "Officer notes must not exceed 2000 characters")
        String officerNotes
) {}
