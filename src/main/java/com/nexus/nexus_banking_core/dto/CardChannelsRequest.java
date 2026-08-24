package com.nexus.nexus_banking_core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardChannelsRequest {
    private Boolean isContactlessEnabled;
    private Boolean isInternationalEnabled;
}

