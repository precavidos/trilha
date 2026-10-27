package br.ufc.trilha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TrilhaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrilhaBackendApplication.class, args);
	}

}
