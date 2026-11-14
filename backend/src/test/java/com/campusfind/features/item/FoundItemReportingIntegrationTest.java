package com.campusfind.features.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.features.item.dto.UpdateFoundItemRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemImageRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class FoundItemReportingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private FoundItemImageRepository foundItemImageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private SecurityOfficeRepository securityOfficeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity student;
    private UserEntity otherStudent;
    private String studentToken;
    private String otherStudentToken;

    private CategoryEntity testCategory;
    private LocationEntity testLocation;
    private SecurityOfficeEntity testOffice;

    @BeforeEach
    void setUp() {
        foundItemImageRepository.deleteAll();
        foundItemRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
        securityOfficeRepository.deleteAll();

        student = new UserEntity("student@uom.lk", passwordEncoder.encode("Password123!"), "Alice Student", UserRole.STUDENT);
        student.setEmailVerified(true);
        userRepository.save(student);
        studentToken = jwtTokenService.generateToken(student);

        otherStudent = new UserEntity("other@uom.lk", passwordEncoder.encode("Password123!"), "Bob Student", UserRole.STUDENT);
        otherStudent.setEmailVerified(true);
        userRepository.save(otherStudent);
        otherStudentToken = jwtTokenService.generateToken(otherStudent);

        testCategory = new CategoryEntity("Electronics", "Laptops, phones, chargers", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Central Library", "Main campus library", "Academic", true);
        locationRepository.save(testLocation);

        testOffice = new SecurityOfficeEntity("Central Security", "Main Admin Bldg", "security@uom.lk", "+94112650301", "24/7");
        securityOfficeRepository.save(testOffice);
    }

    @AfterEach
    void tearDown() {
        foundItemImageRepository.deleteAll();
        foundItemRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
        securityOfficeRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully report a found item with PENDING_HANDOVER status")
    void testReportFoundItem_Success() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Blue Scientific Calculator",
                "Casio fx-991EX found on table 4",
                testCategory.getId(),
                testLocation.getId(),
                "Table 4, 2nd floor",
                Instant.now().minus(1, ChronoUnit.HOURS),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Blue Scientific Calculator"))
                .andExpect(jsonPath("$.handoverStatus").value("PENDING"))
                .andExpect(jsonPath("$.availabilityStatus").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.discoveredByUserId").value(student.getId().toString()))
                .andExpect(jsonPath("$.designatedSecurityOfficeName").value("Central Security"));

        assertThat(foundItemRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should reject found report with validation errors")
    void testReportFoundItem_ValidationErrors() throws Exception {
        CreateFoundItemRequest invalidRequest = new CreateFoundItemRequest(
                "", // Blank title
                "Short", // Less than 5 chars
                null,
                null,
                null,
                Instant.now().plus(1, ChronoUnit.DAYS), // Future date
                null
        );

        mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors").isArray());
    }

    @Test
    @DisplayName("Should reject report creation when unauthenticated")
    void testReportFoundItem_Unauthenticated() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Lost Wallet",
                "Leather wallet with coins",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/found-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Pending handover items must be excluded from public browse endpoint")
    void testPendingReport_ExcludedFromPublicBrowse() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "MacBook Air Charger",
                "White MagSafe USB-C charger found in discussion room",
                testCategory.getId(),
                testLocation.getId(),
                "Room B",
                Instant.now().minus(2, ChronoUnit.HOURS),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Public browse should be empty because item is PENDING handover
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Finder can view own pending item, but unauthorized users receive 403")
    void testPendingReport_AccessControl() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Student ID Card",
                "Found near entrance",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        String responseJson = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String itemId = objectMapper.readTree(responseJson).get("id").asText();

        // Finder can access
        mockMvc.perform(get("/api/v1/found-items/" + itemId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(itemId));

        // Other student is forbidden because item is not yet AVAILABLE
        mockMvc.perform(get("/api/v1/found-items/" + itemId)
                        .header("Authorization", "Bearer " + otherStudentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Finder can retrieve all self-reported items via /me")
    void testGetMyFoundReports() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Umbrella",
                "Black compact umbrella",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/found-items/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Umbrella"));
    }

    @Test
    @DisplayName("Finder can update pending found item report")
    void testUpdatePendingFoundItem() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Water Bottle",
                "Metal bottle",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        String res = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(res).get("id").asText();

        UpdateFoundItemRequest updateReq = new UpdateFoundItemRequest(
                "Hydro Flask Water Bottle",
                "Blue Hydro Flask 500ml",
                null, null, "Under the front desk"
        );

        mockMvc.perform(put("/api/v1/found-items/" + itemId)
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Hydro Flask Water Bottle"))
                .andExpect(jsonPath("$.specificLocation").value("Under the front desk"));
    }

    @Test
    @DisplayName("Finder can cancel pending report")
    void testCancelPendingReport() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Keys",
                "Bunch of hostel keys",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        String res = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(res).get("id").asText();

        mockMvc.perform(post("/api/v1/found-items/" + itemId + "/cancel")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handoverStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.availabilityStatus").value("UNAVAILABLE"));
    }

    @Test
    @DisplayName("Should successfully upload and delete image for found item")
    void testImageUploadAndDelete() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Digital Watch",
                "Black digital wristwatch",
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now(),
                testOffice.getId()
        );

        String res = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(res).get("id").asText();

        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "watch.jpg", "image/jpeg", "dummy-image-bytes".getBytes()
        );

        String uploadRes = mockMvc.perform(multipart("/api/v1/found-items/" + itemId + "/images")
                        .file(imageFile)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.originalFilename").value("watch.jpg"))
                .andReturn().getResponse().getContentAsString();

        String imageId = objectMapper.readTree(uploadRes).get("id").asText();

        // Delete image
        mockMvc.perform(delete("/api/v1/found-items/" + itemId + "/images/" + imageId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isNoContent());

        assertThat(foundItemImageRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should reject image with invalid content type")
    void testImageUpload_InvalidType() throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Book", "Algorithm design textbook",
                testCategory.getId(), testLocation.getId(), null, Instant.now(), testOffice.getId()
        );

        String res = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(res).get("id").asText();

        MockMultipartFile textFile = new MockMultipartFile(
                "file", "malicious.txt", "text/plain", "hello".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/found-items/" + itemId + "/images")
                        .file(textFile)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unsupported image format. Allowed: JPEG, PNG, WebP"));
    }
}
