package com.campusfind.features.lostreport.dto;

import java.util.UUID;

public record StudentContactInfo(
        UUID id,
        String fullName,
        String email,
        String phoneNumber
) {}
