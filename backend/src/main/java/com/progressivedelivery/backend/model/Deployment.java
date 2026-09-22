package com.progressivedelivery.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "deployments")
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String serviceName;
    private String version;
    private String environment;
    private String traffic;
    private String status;

    public Deployment() {
        // Required by JPA
    }

    public Deployment(
            String serviceName,
            String version,
            String environment,
            String traffic,
            String status) {

        this.serviceName = serviceName;
        this.version = version;
        this.environment = environment;
        this.traffic = traffic;
        this.status = status;
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

    public String getEnvironment() {
        return environment;
    }

    public String getTraffic() {
        return traffic;
    }

    public String getStatus() {
        return status;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public void setTraffic(String traffic) {
        this.traffic = traffic;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}