package br.ufc.trilha;

import org.springframework.boot.SpringApplication;

public class TestTrilhaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(TrilhaBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
