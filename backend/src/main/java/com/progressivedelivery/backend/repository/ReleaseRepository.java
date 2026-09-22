package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.Release;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReleaseRepository extends JpaRepository<Release, Integer> {
}