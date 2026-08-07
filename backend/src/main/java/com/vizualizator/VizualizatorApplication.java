package com.vizualizator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VizualizatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(VizualizatorApplication.class, args);
    }
}
