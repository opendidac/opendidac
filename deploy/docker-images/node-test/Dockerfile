# Use an official Node.js image from the Docker Hub
FROM node:latest

LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

# Install necessary tools and libraries
RUN mkdir /src
RUN chmod -R 755 /src
# Set the working directory for the project
WORKDIR /src

# Copy the package.json file
COPY package.json /src

# Copy the customReporter.js  
COPY customReporter.js /src

# Clear npm's cache to avoid any cache-related issues
RUN npm cache clean --force

RUN npm install

WORKDIR /