# Stage 1: Build with Maven
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper & pom.xml for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Lightweight runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy built jar from builder
COPY --from=build /app/target/nexus-banking-core-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
