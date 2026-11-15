package com.campusfind.features.reputation;

import com.campusfind.features.reputation.dto.ReputationBalanceResponse;
import com.campusfind.features.reputation.dto.ReputationTransactionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/reputation")
@Tag(name = "Reputation & Points", description = "Endpoints for students and users to query their reputation balance and transaction history")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class ReputationController {

    private final ReputationService reputationService;

    public ReputationController(ReputationService reputationService) {
        this.reputationService = reputationService;
    }

    @GetMapping
    @Operation(summary = "Get my reputation balance", description = "Retrieves the authenticated user's current reputation points balance and total earned points.")
    public ResponseEntity<ReputationBalanceResponse> getMyReputationBalance(Principal principal) {
        ReputationBalanceResponse balance = reputationService.getBalance(principal.getName());
        return ResponseEntity.ok(balance);
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get my reputation transactions", description = "Retrieves an auditable, paginated list of points awarded or adjusted for the authenticated user, newest first.")
    public ResponseEntity<Page<ReputationTransactionResponse>> getMyReputationTransactions(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReputationTransactionResponse> transactions = reputationService.getHistory(principal.getName(), pageable);
        return ResponseEntity.ok(transactions);
    }
}
