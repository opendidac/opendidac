# Pull the base image
FROM node:20-bullseye-slim

LABEL org.opencontainers.image.source="https://github.com/heigvd-teaching-tools/eval-infra/app-image"

# Install dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg2 \
    openssl \
    apt-transport-https \
    software-properties-common

# Check if we are in production
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Set the working directory
WORKDIR /app

# Copy the app's source code
COPY . .

# Install Google Chrome for Puppeteer
RUN apt-get update && \
    apt-get install -y wget gnupg --no-install-recommends && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 --no-install-recommends

# Install Node.js dependencies
RUN npm cache clean --force
RUN npm install -g npm@latest
RUN rm -rf node_modules package-lock.json
RUN npm install

# Generate Prisma client for multiple platforms
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
