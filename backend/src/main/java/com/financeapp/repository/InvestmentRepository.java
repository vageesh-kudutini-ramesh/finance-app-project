package com.financeapp.repository;

import com.financeapp.entity.Investment;
import com.financeapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUser(User user);
    List<Investment> findByUserAndSymbol(User user, String symbol);
}
