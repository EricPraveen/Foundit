package com.campusfind.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI campusFindOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Foundit (CampusFind) API")
                        .description("University Lost and Found Management Platform REST API")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Foundit Engineering Team")
                                .email("engineering@campusfind.uom.lk")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
