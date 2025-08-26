package com.financeapp.service;

import com.financeapp.dto.InvestmentRequest;
import com.financeapp.entity.Investment;
import com.financeapp.entity.User;
import com.financeapp.repository.InvestmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvestmentService {

    @Autowired
    private InvestmentRepository investmentRepository;

    public List<Investment> getUserInvestments(User user) {
        return investmentRepository.findByUser(user);
    }

    public Investment createInvestment(InvestmentRequest request, User user) {
        Investment investment = new Investment(
                request.getSymbol(),
                request.getName(),
                request.getShares(),
                request.getPurchasePrice(),
                request.getCurrentPrice(),
                user
        );
        investment.setCreatedAt(LocalDateTime.now());
        investment.setUpdatedAt(LocalDateTime.now());
        return investmentRepository.save(investment);
    }

    public Investment updateInvestment(Long id, InvestmentRequest request) {
        Investment investment = investmentRepository.findById(id).orElse(null);
        if (investment == null) return null;

        investment.setCurrentPrice(request.getCurrentPrice());
        investment.setUpdatedAt(LocalDateTime.now());
        return investmentRepository.save(investment);
    }

    public void deleteInvestment(Long id) {
        investmentRepository.deleteById(id);
    }
}
