package com.progressivedelivery.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "releases")
public class Release {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String serviceName;

    private String version;

    private String status;

    private boolean approved;

    public Release() {
        // Required by JPA
    }

    public Release(String serviceName, String version, String status, boolean approved) {
        this.serviceName = serviceName;
        this.version = version;
        this.status = status;
        this.approved = approved;
    }

    public Integer getId() {
        return id;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getVersion() {
        return version;
    }

    public String getStatus() {
        return status;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}