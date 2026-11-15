package com.campusfind.features.officer;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.officer.dto.OfficerDashboardResponse;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OfficerDashboardService {

    private final UserRepository userRepository;
    private final SecurityOfficerProfileRepository officerProfileRepository;
    private final FoundItemRepository foundItemRepository;
    private final ClaimRepository claimRepository;
    private final LostReportRepository lostReportRepository;

    public OfficerDashboardService(
            UserRepository userRepository,
            SecurityOfficerProfileRepository officerProfileRepository,
            FoundItemRepository foundItemRepository,
            ClaimRepository claimRepository,
            LostReportRepository lostReportRepository) {
        this.userRepository = userRepository;
        this.officerProfileRepository = officerProfileRepository;
        this.foundItemRepository = foundItemRepository;
        this.claimRepository = claimRepository;
        this.lostReportRepository = lostReportRepository;
    }

    @Transactional(readOnly = true)
    public OfficerDashboardResponse getDashboard(String officerEmail) {
        UserEntity user = userRepository.findByEmail(officerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Officer user not found: " + officerEmail));

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            long available = foundItemRepository.countByAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
            long pendingHandovers = foundItemRepository.countByHandoverStatus(HandoverStatus.PENDING);
            long pendingClaims = claimRepository.countByStatus(ClaimStatus.PENDING);
            long pendingCollection = claimRepository.countByStatus(ClaimStatus.APPROVED);
            long returned = foundItemRepository.countByAvailabilityStatus(ItemAvailabilityStatus.RETURNED);
            long unclaimed = foundItemRepository.countByAvailabilityStatus(ItemAvailabilityStatus.UNCLAIMED);
            long activeLost = lostReportRepository.countByStatus(LostReportStatus.ACTIVE);

            return new OfficerDashboardResponse(
                    available,
                    pendingHandovers,
                    pendingClaims,
                    pendingCollection,
                    returned,
                    unclaimed,
                    activeLost,
                    null,
                    "All Security Offices"
            );
        }

        SecurityOfficerProfileEntity profile = officerProfileRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile is not configured."));

        SecurityOfficeEntity office = profile.getSecurityOffice();
        UUID officeId = office != null ? office.getId() : null;
        String officeName = office != null ? office.getName() : "Central Security Office";

        long available = officeId != null
                ? foundItemRepository.countByDesignatedSecurityOfficeIdAndAvailabilityStatus(officeId, ItemAvailabilityStatus.AVAILABLE)
                : 0L;
        long pendingHandovers = officeId != null
                ? foundItemRepository.countByDesignatedSecurityOfficeIdAndHandoverStatus(officeId, HandoverStatus.PENDING)
                : 0L;
        long pendingClaims = officeId != null
                ? claimRepository.countByFoundItemDesignatedSecurityOfficeIdAndStatus(officeId, ClaimStatus.PENDING)
                : 0L;
        long pendingCollection = officeId != null
                ? claimRepository.countByFoundItemDesignatedSecurityOfficeIdAndStatus(officeId, ClaimStatus.APPROVED)
                : 0L;
        long returned = officeId != null
                ? foundItemRepository.countByDesignatedSecurityOfficeIdAndAvailabilityStatus(officeId, ItemAvailabilityStatus.RETURNED)
                : 0L;
        long unclaimed = officeId != null
                ? foundItemRepository.countByDesignatedSecurityOfficeIdAndAvailabilityStatus(officeId, ItemAvailabilityStatus.UNCLAIMED)
                : 0L;
        long activeLost = officeId != null
                ? lostReportRepository.countByDesignatedSecurityOfficeIdAndStatus(officeId, LostReportStatus.ACTIVE)
                : 0L;

        return new OfficerDashboardResponse(
                available,
                pendingHandovers,
                pendingClaims,
                pendingCollection,
                returned,
                unclaimed,
                activeLost,
                officeId,
                officeName
        );
    }
}
