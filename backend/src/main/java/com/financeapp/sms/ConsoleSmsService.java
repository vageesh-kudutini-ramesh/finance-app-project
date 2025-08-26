package com.financeapp.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "sms.provider", havingValue = "console", matchIfMissing = true)
public class ConsoleSmsService implements SmsService {
    private static final Logger log = LoggerFactory.getLogger(ConsoleSmsService.class);

    @Override
    public void sendSms(String toE164, String message) {
        log.info("📨 [DEV SMS] To: {} | Message: {}", toE164, message);
        // No-op (development only)
    }
}
