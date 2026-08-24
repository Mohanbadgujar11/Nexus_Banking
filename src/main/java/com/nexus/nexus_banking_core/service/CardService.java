package com.nexus.nexus_banking_core.service;

import java.util.List;

import com.nexus.nexus_banking_core.dto.CardChannelsRequest;
import com.nexus.nexus_banking_core.dto.CardLimitsRequest;
import com.nexus.nexus_banking_core.dto.CardResponse;
import com.nexus.nexus_banking_core.dto.IssueCardRequest;

public interface CardService {
    List<CardResponse> getCardsByUserId(Long userId);
    CardResponse toggleFreezeCard(Long cardId);
    CardResponse updateCardLimits(Long cardId, CardLimitsRequest request);
    CardResponse updateCardChannels(Long cardId, CardChannelsRequest request);
    CardResponse issueCard(IssueCardRequest request);
}

