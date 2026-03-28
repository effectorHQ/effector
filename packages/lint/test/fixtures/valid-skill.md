---
name: docker-manager
description: "Manage Docker containers and images with simple commands"
metadata:
  openclaw:
    emoji: 🐳
    requires:
      bins:
        - docker
      env:
        - DOCKER_HOST
    install:
      - id: brew
        kind: brew
        formula: docker
        label: "Install via Homebrew"
      - id: manual
        kind: manual
        label: "Manual installation"
        steps:
          - "Visit https://docker.com/products/docker-desktop"
          - "Download and install Docker Desktop"
          - "Verify: docker --version"
---

## Purpose

This skill provides commands to manage Docker containers, images, and services. It allows you to:
- List and inspect running containers
- Start, stop, and remove containers
- Build and push images
- Manage Docker volumes and networks

## When to Use

Use this skill when you need to:
- Deploy and manage containerized applications
- Troubleshoot container issues
- Automate Docker operations in CI/CD pipelines
- Work with Docker Compose configurations

## When NOT to Use

- For Kubernetes workloads (use the kubernetes skill instead)
- For container orchestration at scale (use Docker Swarm or Kubernetes)
- When you need system-level container inspection (use crio or containerd directly)

## Setup

### Prerequisites

1. **Docker**: Install Docker Desktop or Docker Engine
   - macOS: `brew install docker` or download Docker Desktop
   - Linux: `sudo apt install docker.io` (Ubuntu/Debian)
   - Windows: Download Docker Desktop

2. **Permissions**: Ensure your user is in the docker group
   ```bash
   sudo usermod -aG docker $USER
   ```

### Local Testing

```bash
# Test docker connectivity
docker ps

# Verify the skill works
openclaw invoke docker-manager list-containers
```

## Commands / Actions

### List Containers
**Description**: Display all running or stopped containers
```
openclaw invoke docker-manager list-containers [--all] [--format json]
```

### Start Container
**Description**: Start a stopped container
```
openclaw invoke docker-manager start --name mycontainer
```

### Stop Container
**Description**: Stop a running container
```
openclaw invoke docker-manager stop --name mycontainer [--timeout 10]
```

### Build Image
**Description**: Build a Docker image from a Dockerfile
```
openclaw invoke docker-manager build --path . --tag myimage:latest
```

## Examples

### Example 1: List All Containers
```bash
openclaw invoke docker-manager list-containers --all
```
Output shows all containers with their status, image, and ports.

### Example 2: Start a Stopped Container
```bash
openclaw invoke docker-manager start --name web-server
```
Starts the web-server container and shows its status.

### Example 3: Build an Image
```bash
openclaw invoke docker-manager build --path ./app --tag myapp:1.0
```
Builds a Docker image from the Dockerfile in ./app directory.

## Notes

- **Permissions**: Requires Docker daemon access (usually requires being in docker group)
- **Platform Support**: Works on macOS, Linux, and Windows (with Docker Desktop)
- **Network**: Some operations may require internet connectivity for image pulls
- **Troubleshooting**:
  - Issue: "Cannot connect to Docker daemon"
  - Solution: Start Docker Desktop or Docker daemon, and verify permissions
  - Issue: "Permission denied while trying to connect to Docker socket"
  - Solution: Add user to docker group or run with sudo
