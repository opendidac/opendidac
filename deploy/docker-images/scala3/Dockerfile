# Use the official Alpine base image
FROM openjdk:17-slim

# Set the maintainer label
LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

# Set environment variables for Scala version and installation directory
ENV SCALA_VERSION=3.2.0 \
    SCALA_HOME=/usr/share/scala

# Install necessary packages: bash, curl, and OpenJDK 17
RUN apt-get update && apt-get install -y bash curl

# Download and install Scala
RUN mkdir -p "$SCALA_HOME" && \
    curl -fL "https://github.com/lampepfl/dotty/releases/download/$SCALA_VERSION/scala3-$SCALA_VERSION.tar.gz" -o scala3.tgz && \
    tar -xzf scala3.tgz -C "$SCALA_HOME" --strip-components=1 && \
    ln -s "$SCALA_HOME/bin/"* /usr/bin/ && \
    rm scala3.tgz

# Set the working directory
WORKDIR /src

# By default, run the Scala REPL
CMD ["scala"]
