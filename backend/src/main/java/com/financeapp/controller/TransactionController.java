package com.financeapp.controller;

import com.financeapp.dto.TransactionRequest;
import com.financeapp.dto.TransactionResponse;
import com.financeapp.entity.Transaction;
import com.financeapp.entity.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        List<TransactionResponse> transactions = transactionService.getUserTransactions(user)
                .stream()
                .map(t -> new TransactionResponse(
                        t.getId(),
                        t.getDescription(),
                        t.getAmount(),
                        t.getCategory(),
                        t.getType().name(),
                        t.getTransactionDate()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(@Valid @RequestBody TransactionRequest request,
                                                                 Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Transaction savedTransaction = transactionService.createTransaction(request, user);
        if (savedTransaction == null) return ResponseEntity.badRequest().body(null);

        TransactionResponse response = new TransactionResponse(
                savedTransaction.getId(),
                savedTransaction.getDescription(),
                savedTransaction.getAmount(),
                savedTransaction.getCategory(),
                savedTransaction.getType().name(),
                savedTransaction.getTransactionDate()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(@PathVariable Long id,
                                                                 @Valid @RequestBody TransactionRequest request,
                                                                 Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Transaction updatedTransaction = transactionService.updateTransaction(id, request);
        if (updatedTransaction == null) return ResponseEntity.notFound().build();

        TransactionResponse response = new TransactionResponse(
                updatedTransaction.getId(),
                updatedTransaction.getDescription(),
                updatedTransaction.getAmount(),
                updatedTransaction.getCategory(),
                updatedTransaction.getType().name(),
                updatedTransaction.getTransactionDate()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id, Authentication authentication) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }
}
