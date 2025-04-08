# Stage 1: Use official Postgres to create DB and preload data
FROM postgres:16 AS builder

LABEL org.opencontainers.image.source="https://github.com/opendidac/database-sandbox-image"

# Setup environment to match your app
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Create needed directories and change ownership
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql

# Copy schema and data
COPY --chown=postgres:postgres schema.sql /schema.sql
COPY --chown=postgres:postgres data.sql /data.sql

# Switch to postgres user and init DB
USER postgres

# Use shell script to start postgres in the background and load data
RUN /usr/local/bin/docker-entrypoint.sh postgres & \
    sleep 5 && \
    until pg_isready -U postgres; do sleep 1; done && \
    psql -U postgres -d postgres -f /schema.sql && \
    psql -U postgres -d postgres -f /data.sql && \
    pg_ctl -D /var/lib/postgresql/data -m fast stop

# Stage 2: Final image with preloaded data
FROM postgres:16

COPY --from=builder /var/lib/postgresql/data /var/lib/postgresql/data
