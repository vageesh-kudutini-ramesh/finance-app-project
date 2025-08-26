package com.financeapp.dto;

import com.financeapp.entity.Budget;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class BudgetRequest {
    @NotBlank
    private String category;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal budgetedAmount;

    @NotNull
    private Budget.BudgetPeriod period;

    // Getters and Setters
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getBudgetedAmount() { return budgetedAmount; }
    public void setBudgetedAmount(BigDecimal budgetedAmount) { this.budgetedAmount = budgetedAmount; }

    public Budget.BudgetPeriod getPeriod() { return period; }
    public void setPeriod(Budget.BudgetPeriod period) { this.period = period; }
}