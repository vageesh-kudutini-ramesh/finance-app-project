package com.financeapp.controller;

import com.financeapp.dto.BudgetRequest;
import com.financeapp.entity.Budget;
import com.financeapp.entity.User;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {
    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Budget>> getUserBudgets(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        List<Budget> budgets = budgetRepository.findByUser(user);
        return ResponseEntity.ok(budgets);
    }

    @PostMapping
    public ResponseEntity<Budget> createBudget(@Valid @RequestBody BudgetRequest request,
                                               Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Budget budget = new Budget(
                request.getCategory(),
                request.getBudgetedAmount(),
                request.getPeriod(),
                user
        );

        Budget savedBudget = budgetRepository.save(budget);
        return ResponseEntity.ok(savedBudget);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(@PathVariable Long id,
                                               @Valid @RequestBody BudgetRequest request,
                                               Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Budget budget = budgetRepository.findById(id).orElse(null);
        if (budget == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if the budget belongs to the authenticated user
        if (!budget.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(null); // Forbidden
        }

        budget.setCategory(request.getCategory());
        budget.setBudgetedAmount(request.getBudgetedAmount());
        budget.setPeriod(request.getPeriod());
        budget.setUpdatedAt(LocalDateTime.now());

        Budget updatedBudget = budgetRepository.save(budget);
        return ResponseEntity.ok(updatedBudget);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBudget(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Budget budget = budgetRepository.findById(id).orElse(null);
        if (budget == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if the budget belongs to the authenticated user
        if (!budget.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(null); // Forbidden
        }

        budgetRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

