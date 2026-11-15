package com.campusfind.features.claim.dto;

public record DownloadedEvidence(
        String filename,
        String contentType,
        byte[] data
) {}
