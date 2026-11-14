package com.campusfind.features.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.category.dto.CreateCategoryRequest;
import com.campusfind.features.category.dto.UpdateCategoryRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
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
class CategoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

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
        categoryRepository.deleteAll();
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
    void activeCategoriesListedPublicly() throws Exception {
        categoryRepository.save(new CategoryEntity("Keys", "Room and vehicle keys", true));
        categoryRepository.save(new CategoryEntity("Books", "Lecture notes and textbooks", true));
        categoryRepository.save(new CategoryEntity("Old Archival", "Inactive items", false));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Books"))
                .andExpect(jsonPath("$[1].name").value("Keys"));
    }

    @Test
    void superAdminCreatesCategory() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Electronics", "Phones and laptops", true);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Electronics"));

        assertThat(categoryRepository.existsByNameIgnoreCase("electronics")).isTrue();
    }

    @Test
    void duplicateCategoryRejected() throws Exception {
        categoryRepository.save(new CategoryEntity("Electronics", "Desc", true));

        CreateCategoryRequest request = new CreateCategoryRequest("ELECTRONICS", "Duplicate check", true);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void studentCannotCreateCategory() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("HackedCat", "Desc", true);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminDeactivatesCategory() throws Exception {
        CategoryEntity cat = categoryRepository.save(new CategoryEntity("Temporary", "Desc", true));

        mockMvc.perform(patch("/api/v1/admin/categories/" + cat.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        CategoryEntity updated = categoryRepository.findById(cat.getId()).orElseThrow();
        assertThat(updated.isActive()).isFalse();
    }
}
