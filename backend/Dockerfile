FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S jobtrack && adduser -S jobtrack -G jobtrack && mkdir /app/data && chown jobtrack:jobtrack /app/data
COPY --from=build --chown=jobtrack:jobtrack /build/target/jobtrack-api-1.0.0.jar app.jar
USER jobtrack
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:InitialRAMPercentage=15 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
