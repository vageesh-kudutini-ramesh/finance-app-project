package com.financeapp.sms;

public interface SmsService {
    void sendSms(String toE164, String message);
}
