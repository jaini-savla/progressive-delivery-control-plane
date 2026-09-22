package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.RegressionCheck;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegressionCheckRepository
        extends JpaRepository<RegressionCheck, Integer> {
}