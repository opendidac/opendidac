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
# ---- Build an AppCDS archive using the EXACT scalac launcher classpath
RUN echo 'object Warm { def main(a:Array[String])=println("warm") }' > /tmp/Warm.scala && \
    /usr/bin/scalac \
      -J-XX:+UseG1GC \
      -J-XX:ArchiveClassesAtExit=/opt/scala-scalac.jsa \
      /tmp/Warm.scala && \
    rm -f /tmp/Warm.scala

# ---- scalac wrapper (G1 to allow CDS heap)
RUN printf '%s\n' '#!/usr/bin/env bash' \
  'exec /usr/bin/scalac \' \
  '  -J-Xshare:auto \' \
  '  -J-XX:SharedArchiveFile=/opt/scala-scalac.jsa \' \
  '  -J-XX:+UseG1GC \' \
  '  -J-XX:TieredStopAtLevel=1 \' \
  '  -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \' \
  '  "$@"' > /usr/local/bin/scalac && chmod +x /usr/local/bin/scalac

# ---- scala (runner) wrapper (also G1)
RUN printf '%s\n' '#!/usr/bin/env bash' \
  'exec /usr/bin/scala \' \
  '  -J-Xshare:auto \' \
  '  -J-XX:SharedArchiveFile=/opt/scala-scalac.jsa \' \
  '  -J-XX:+UseG1GC \' \
  '  -J-XX:TieredStopAtLevel=1 \' \
  '  -J-Xms64m -J-Xmx128m -J-XX:ReservedCodeCacheSize=64m \' \
  '  "$@"' > /usr/local/bin/scala && chmod +x /usr/local/bin/scala

# Default command (REPL)
CMD ["scala"]
