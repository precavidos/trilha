package br.ufc.trilha.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class CorsConfig implements WebMvcConfigurer {

	private final String[] origens;

	CorsConfig(@Value("${trilha.cors.allowed-origins}") String[] origens) {
		this.origens = origens;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**").allowedOrigins(origens).allowedMethods("GET", "POST");
	}

}
