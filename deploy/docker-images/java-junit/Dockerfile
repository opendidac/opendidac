# Use an official Temurin (Eclipse) OpenJDK image from the Docker Hub
FROM eclipse-temurin:latest

LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

# Install necessary tools and libraries
RUN apt-get update && apt-get install -y \
    wget \
    unzip

# Set the working directory for downloading dependencies
WORKDIR /opt/java

# Download JUnit and Hamcrest core JARs
RUN wget https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar && \
    wget https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar

# Setup the environment variable CLASSPATH
ENV CLASSPATH /opt/java/junit-4.13.2.jar:/opt/java/hamcrest-core-1.3.jar:.

WORKDIR /