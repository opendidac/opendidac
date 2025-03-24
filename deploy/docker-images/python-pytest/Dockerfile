# Use an official Python image from the Docker Hub
FROM python:latest

LABEL org.opencontainers.image.source="https://github.com/opendidac/code-check-image"

# Install necessary tools and libraries
RUN mkdir /src
RUN chmod -R 755 /src

# Set the working directory for the project
WORKDIR /src

# Copy the requirements.txt file
COPY requirements.txt /src

# Install pytest and other dependencies
RUN pip install -r requirements.txt

# Copy the conftest.py file
COPY conftest.py /src