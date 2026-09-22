package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.Traffic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrafficRepository extends JpaRepository<Traffic, Integer> {
}