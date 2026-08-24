package com.nexus.nexus_banking_core.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexus.nexus_banking_core.dto.ApiResponse;
import com.nexus.nexus_banking_core.dto.CardChannelsRequest;
import com.nexus.nexus_banking_core.dto.CardLimitsRequest;
import com.nexus.nexus_banking_core.dto.CardResponse;
import com.nexus.nexus_banking_core.dto.IssueCardRequest;
import com.nexus.nexus_banking_core.service.CardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByUserId(@PathVariable Long userId) {
        List<CardResponse> cards = cardService.getCardsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("User cards retrieved successfully", cards));
    }

    @PatchMapping("/{cardId}/freeze")
    public ResponseEntity<ApiResponse<CardResponse>> toggleFreezeCard(@PathVariable Long cardId) {
        CardResponse card = cardService.toggleFreezeCard(cardId);
        String msg = Boolean.TRUE.equals(card.getIsFrozen()) ? "Card frozen successfully" : "Card unlocked successfully";
        return ResponseEntity.ok(ApiResponse.success(msg, card));
    }

    @PatchMapping("/{cardId}/limits")
    public ResponseEntity<ApiResponse<CardResponse>> updateLimits(
            @PathVariable Long cardId,
            @Valid @RequestBody CardLimitsRequest request) {
        CardResponse card = cardService.updateCardLimits(cardId, request);
        return ResponseEntity.ok(ApiResponse.success("Card authorization limits updated", card));
    }

    @PatchMapping("/{cardId}/channels")
    public ResponseEntity<ApiResponse<CardResponse>> updateChannels(
            @PathVariable Long cardId,
            @RequestBody CardChannelsRequest request) {
        CardResponse card = cardService.updateCardChannels(cardId, request);
        return ResponseEntity.ok(ApiResponse.success("Card payment channels updated", card));
    }

    @PostMapping("/issue")
    public ResponseEntity<ApiResponse<CardResponse>> issueCard(@Valid @RequestBody IssueCardRequest request) {
        CardResponse card = cardService.issueCard(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("New payment card issued successfully", card));
    }
}

