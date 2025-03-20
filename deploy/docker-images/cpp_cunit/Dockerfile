# Use an official GCC image from the Docker Hub
FROM gcc:latest

LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

# Install CUnit for unit testing
RUN apt-get update && apt-get install -y \
    libcunit1-dev \
    libcunit1