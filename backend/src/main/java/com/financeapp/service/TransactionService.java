package com.financeapp.service;

import com.financeapp.entity.Transaction;
import com.financeapp.dto.TransactionRequest;
import com.financeapp.entity.User;
import com.financeapp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    public List<Transaction> getUserTransactions(User user) {
        return transactionRepository.findByUserOrderByTransactionDateDesc(user);
    }

    public Transaction createTransaction(TransactionRequest request, User user) {
        Transaction.TransactionType typeEnum = request.getTransactionTypeEnum();
        if (typeEnum == null) return null;

        Transaction transaction = new Transaction(
                request.getDescription(),
                request.getAmount(),
                request.getCategory(),
                typeEnum,
                request.getTransactionDate() != null ? request.getTransactionDate() : LocalDate.now(),
                user
        );
        return transactionRepository.save(transaction);
    }

    public Transaction updateTransaction(Long id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id).orElse(null);
        if (transaction == null) return null;

        transaction.setDescription(request.getDescription());
        transaction.setAmount(request.getAmount());
        transaction.setCategory(request.getCategory());

        Transaction.TransactionType typeEnum = request.getTransactionTypeEnum();
        if (typeEnum != null) transaction.setType(typeEnum);

        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactionsByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByUserAndTransactionDateBetween(user, startDate, endDate);
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }
}
