package com.financeapp.controller;

import com.financeapp.dto.InvestmentRequest;
import com.financeapp.entity.Investment;
import com.financeapp.entity.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.InvestmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
    private InvestmentService investmentService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Investment>> getUserInvestments(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        List<Investment> investments = investmentService.getUserInvestments(user);
        return ResponseEntity.ok(investments);
    }

    @PostMapping
    public ResponseEntity<Investment> createInvestment(@Valid @RequestBody InvestmentRequest request,
                                                       Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Investment savedInvestment = investmentService.createInvestment(request, user);
        return ResponseEntity.ok(savedInvestment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Investment> updateInvestment(@PathVariable Long id,
                                                       @Valid @RequestBody InvestmentRequest request) {
        Investment updatedInvestment = investmentService.updateInvestment(id, request);
        if (updatedInvestment == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updatedInvestment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvestment(@PathVariable Long id) {
        investmentService.deleteInvestment(id);
        return ResponseEntity.ok().build();
    }
}
