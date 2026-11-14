package com.campusfind.features.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.location.dto.CreateLocationRequest;
import com.campusfind.features.location.dto.UpdateLocationRequest;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LocationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        locationRepository.deleteAll();
        userRepository.deleteAll();

        UserEntity admin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1"), "Admin", UserRole.SUPER_ADMIN);
        admin.setEmailVerified(true);
        userRepository.save(admin);
        adminToken = jwtTokenService.generateToken(admin);

        UserEntity student = new UserEntity("student@uom.lk", passwordEncoder.encode("Pass2"), "Student", UserRole.STUDENT);
        student.setEmailVerified(true);
        userRepository.save(student);
        studentToken = jwtTokenService.generateToken(student);
    }

    @Test
    void activeLocationsListedAlphabetically() throws Exception {
        locationRepository.save(new LocationEntity("Main Canteen", "Services", "Dining hall", true));
        locationRepository.save(new LocationEntity("Central Library", "Academic", "Study halls", true));
        locationRepository.save(new LocationEntity("Demolished Shed", "Old", "Inactive", false));

        mockMvc.perform(get("/api/v1/locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Central Library"))
                .andExpect(jsonPath("$[1].name").value("Main Canteen"));
    }

    @Test
    void superAdminCreatesLocation() throws Exception {
        CreateLocationRequest request = new CreateLocationRequest("Gymnasium", "Sports", "Indoor complex", true);

        mockMvc.perform(post("/api/v1/admin/locations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Gymnasium"));

        assertThat(locationRepository.existsByNameIgnoreCase("gymnasium")).isTrue();
    }

    @Test
    void duplicateLocationRejected() throws Exception {
        locationRepository.save(new LocationEntity("Library", "Academic", "Desc", true));

        CreateLocationRequest request = new CreateLocationRequest("LIBRARY", "Academic", "Duplicate", true);

        mockMvc.perform(post("/api/v1/admin/locations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void studentCannotCreateLocation() throws Exception {
        CreateLocationRequest request = new CreateLocationRequest("StudentRoom", "Zone", "Desc", true);

        mockMvc.perform(post("/api/v1/admin/locations")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminDeactivatesLocation() throws Exception {
        LocationEntity loc = locationRepository.save(new LocationEntity("Temp Shed", "Zone", "Desc", true));

        mockMvc.perform(patch("/api/v1/admin/locations/" + loc.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        LocationEntity updated = locationRepository.findById(loc.getId()).orElseThrow();
        assertThat(updated.isActive()).isFalse();
    }
}
