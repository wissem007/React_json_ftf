# Multi-stage build pour optimiser la taille
FROM openjdk:17-jdk-slim as builder

WORKDIR /app

# Copier les fichiers de configuration Maven/Gradle
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Télécharger les dépendances (mise en cache)
RUN ./mvnw dependency:go-offline -B

# Copier le code source
COPY src src

# Build de l'application
RUN ./mvnw clean package -DskipTests

# Image finale optimisée
FROM openjdk:17-jre-slim

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=builder /app/target/*.jar app.jar

# Changer le propriétaire
RUN chown appuser:appgroup app.jar

# Utiliser l'utilisateur non-root
USER appuser

# Port d'exposition
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Commande de démarrage avec optimisations JVM
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Xms256m", \
  "-Xmx512m", \
  "-XX:+UseG1GC", \
  "-jar", \
  "app.jar"]