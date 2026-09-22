package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeatureFlagRepository
        extends JpaRepository<FeatureFlag, Integer> {
}