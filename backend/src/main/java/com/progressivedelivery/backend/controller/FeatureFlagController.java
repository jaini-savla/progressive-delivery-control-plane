package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.FeatureFlag;
import com.progressivedelivery.backend.repository.FeatureFlagRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagRepository featureFlagRepository;

    public FeatureFlagController(
            FeatureFlagRepository featureFlagRepository) {

        this.featureFlagRepository = featureFlagRepository;
    }

    // Get all feature flags
    @GetMapping
    public List<FeatureFlag> getFeatureFlags() {

        return featureFlagRepository.findAll();
    }

    // Create a new feature flag
    @PostMapping
    public ResponseEntity<?> createFeatureFlag(
            @RequestBody FeatureFlagRequest request) {

        if (request.getName() == null ||
                request.getName().trim().isEmpty()) {

            return ResponseEntity.badRequest().body(
                    "Feature flag name is required"
            );
        }

        FeatureFlag featureFlag = new FeatureFlag(
                request.getName(),
                request.getDescription(),
                request.isEnabled()
        );

        FeatureFlag savedFeatureFlag =
                featureFlagRepository.save(featureFlag);

        return ResponseEntity.ok(savedFeatureFlag);
    }

    // Update a feature flag
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFeatureFlag(
            @PathVariable Integer id,
            @RequestBody FeatureFlagRequest request) {

        return featureFlagRepository.findById(id)
                .map(featureFlag -> {

                    if (request.getName() != null &&
                            !request.getName().trim().isEmpty()) {

                        featureFlag.setName(
                                request.getName());
                    }

                    featureFlag.setDescription(
                            request.getDescription());

                    featureFlag.setEnabled(
                            request.isEnabled());

                    FeatureFlag updatedFeatureFlag =
                            featureFlagRepository.save(featureFlag);

                    return ResponseEntity.ok(updatedFeatureFlag);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // Enable or disable a feature flag
    @PostMapping("/{id}/toggle")
    public ResponseEntity<?> toggleFeatureFlag(
            @PathVariable Integer id) {

        return featureFlagRepository.findById(id)
                .map(featureFlag -> {

                    featureFlag.setEnabled(
                            !featureFlag.isEnabled());

                    FeatureFlag updatedFeatureFlag =
                            featureFlagRepository.save(featureFlag);

                    return ResponseEntity.ok(updatedFeatureFlag);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // Delete a feature flag
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFeatureFlag(
            @PathVariable Integer id) {

        if (!featureFlagRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        featureFlagRepository.deleteById(id);

        return ResponseEntity.ok(
                "Feature flag deleted successfully"
        );
    }

    // Request class
    public static class FeatureFlagRequest {

        private String name;
        private String description;
        private boolean enabled;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}