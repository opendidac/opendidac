FROM openjdk:17-slim

LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

ENV SCALA_VERSION=3.2.0 \
    SCALA_HOME=/usr/share/scala \
    PATH="/usr/local/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Scala 3
RUN mkdir -p "$SCALA_HOME" && \
    curl -fsSL "https://github.com/lampepfl/dotty/releases/download/${SCALA_VERSION}/scala3-${SCALA_VERSION}.tar.gz" -o /tmp/scala3.tgz && \
    tar -xzf /tmp/scala3.tgz -C "$SCALA_HOME" --strip-components=1 && \
    rm /tmp/scala3.tgz && \
    ln -s "$SCALA_HOME/bin/"* /usr/bin/

WORKDIR /src
# ---- Copy warmup sources and build an AppCDS archive using the EXACT scalac launcher classpath
COPY warmup/ /warmup/
RUN /usr/bin/scalac \
      -J-XX:+UseG1GC \
      -J-XX:ArchiveClassesAtExit=/opt/scala-scalac.jsa \
      /warmup/*.scala
# ---- Build scalac archive (compiler)
# Use the SAME flags here as in the wrapper later
RUN /usr/bin/scalac \
      -J-Xshare:auto \
      -J-XX:+UseG1GC \
      -J-XX:TieredStopAtLevel=1 \
      -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \
      -J-XX:+UnlockDiagnosticVMOptions \
      -J-XX:ArchiveClassesAtExit=/opt/scalac.jsa \
      /warmup/*.scala

# ---- Build scala runner archive
# Compile once and run it so runner paths get archived too
RUN /usr/bin/scalac /warmup/Main.scala && \
    /usr/bin/scala \
      -J-Xshare:auto \
      -J-XX:+UseG1GC \
      -J-XX:TieredStopAtLevel=1 \
      -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \
      -J-XX:+UnlockDiagnosticVMOptions \
      -J-XX:ArchiveClassesAtExit=/opt/scala-run.jsa \
      Main 1 2 3

# ---- scalac wrapper (compiler)
RUN printf '%s\n' '#!/usr/bin/env bash' \
  'exec /usr/bin/scalac \' \
  '  -J-Xshare:auto \' \
  '  -J-XX:SharedArchiveFile=/opt/scalac.jsa \' \
  '  -J-XX:+UseG1GC \' \
  '  -J-XX:TieredStopAtLevel=1 \' \
  '  -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \' \
  '  "$@"' > /usr/local/bin/scalac && chmod +x /usr/local/bin/scalac

# ---- scala wrapper (runner)
RUN printf '%s\n' '#!/usr/bin/env bash' \
  'exec /usr/bin/scala \' \
  '  -J-Xshare:auto \' \
  '  -J-XX:SharedArchiveFile=/opt/scala-run.jsa \' \
  '  -J-XX:+UseG1GC \' \
  '  -J-XX:TieredStopAtLevel=1 \' \
  '  -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \' \
  '  "$@"' > /usr/local/bin/scala && chmod +x /usr/local/bin/scala

# Default command (REPL)
CMD ["scala"]
