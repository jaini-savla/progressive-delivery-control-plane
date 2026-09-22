package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.Metrics;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MetricsRepository
        extends JpaRepository<Metrics, Integer> {
}