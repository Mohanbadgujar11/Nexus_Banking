# Stage 1: Build application with Maven and JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy maven wrapper files and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Cache Maven dependencies
RUN ./mvnw dependency:go-offline -B

# Copy application source and build production JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Create lightweight runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy built JAR from the builder stage
COPY --from=builder /app/target/nexus-banking-core-0.0.1-SNAPSHOT.jar app.jar

# Expose port (Render dynamically assigns $PORT)
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
