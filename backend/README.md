# Foundit (CampusFind) — Backend

The Foundit backend is a modular monolith built with **Java 21** and **Spring Boot 3.3.5**, connecting to PostgreSQL with **Flyway** schema migrations, Spring Data JPA, Actuator health monitoring, and OpenAPI/Swagger documentation.

## Prerequisites

- **Java Development Kit (JDK):** Version 21 (Eclipse Temurin / OpenJDK recommended)
- **Maven:** 3.9+ (or use the included Maven Wrapper `./mvnw`)
- **Database:** PostgreSQL 15+ (local or hosted Supabase PostgreSQL)

## Technology Stack & Versions

- **Language:** Java 21 (`java.version: 21`)
- **Framework:** Spring Boot `3.3.5`
- **Data & Persistence:** Spring Data JPA / Hibernate `6.5.3.Final`
- **Database Driver:** PostgreSQL JDBC Driver `42.7.4`
- **Schema Migrations:** Flyway `10.10.0` with `flyway-database-postgresql`
- **Validation:** Jakarta Validation / Hibernate Validator (`spring-boot-starter-validation`)
- **Monitoring & Metrics:** Spring Boot Actuator (`/actuator/health`, `/actuator/info`)
- **API Documentation:** SpringDoc OpenAPI 3.0 / Swagger UI `2.6.0` (`/swagger-ui.html`, `/v3/api-docs`)
- **Testing:** JUnit 5, Mockito, AssertJ, MockMvc, H2 (test profile)

## Package Architecture

Root package: `com.campusfind`

```
com.campusfind
├── CampusFindApplication.java        # Main Spring Boot Application entrypoint
├── common
│   ├── config
│   │   └── OpenApiConfig.java        # Swagger/OpenAPI metadata configuration
│   └── error
│       ├── ErrorResponse.java        # Standardized API error response record
│       ├── ValidationError.java      # Field-level validation detail record
│       └── GlobalExceptionHandler.java # RestControllerAdvice error handler
└── infrastructure
    └── persistence
        ├── SystemSettingEntity.java  # Baseline foundation JPA entity
        └── SystemSettingRepository.java # JPA repository
```

## Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `8080` | HTTP port for the Spring Boot application |
| `DB_HOST` | `localhost` | PostgreSQL host address (e.g. Supabase direct or pooler host) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `change-me` | Database password (keep strictly secret, never commit) |
| `DB_SSLMODE` | `prefer` | SSL mode (`require` for Supabase hosted instances) |
| `FLYWAY_ENABLED` | `true` | Apply database migrations automatically on startup |
| `SWAGGER_UI_ENABLED`| `true` | Enable Swagger UI (`/swagger-ui.html`) |
| `ACTUATOR_HEALTH_DETAILS` | `never` | Health endpoint details exposure (`never` or `when-authorized`) |

## Running the Application Locally

1. **Build and run automated tests:**
   ```bash
   cd backend
   ./mvnw clean test
   ```

2. **Start the backend locally:**
   ```bash
   cd backend
   # Export environment variables from .env or pass directly:
   export $(grep -v '^#' .env | xargs)
   ./mvnw spring-boot:run
   ```

3. **Verify Health and API Docs:**
   - Health endpoint: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
   - Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   - OpenAPI Contract: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Database Migrations (Flyway)

Flyway is the authoritative schema migration engine.
- Migrations are stored in `backend/src/main/resources/db/migration/`
- Naming format: `V<Version>__<Description>.sql` (e.g., `V1__init_foundation.sql`)
- Hibernate DDL auto-generation is set to `validate` (`spring.jpa.hibernate.ddl-auto=validate`) to prevent unexpected schema mutation outside of controlled migrations.
