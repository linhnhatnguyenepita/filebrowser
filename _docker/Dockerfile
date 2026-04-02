# Stage 1: Build Go binary (no embed)
FROM golang:alpine AS go-build
ARG VERSION
ARG REVISION
WORKDIR /app
COPY ./backend/ ./
RUN apk update && apk add --no-cache upx
RUN go build -ldflags="-w -s \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.Version=${VERSION}' \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.CommitSHA=${REVISION}'" \
  -o filebrowser .
RUN upx filebrowser

# Stage 2: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY ./frontend-next/package*.json ./
RUN npm ci
COPY ./frontend-next/ ./
RUN npm run build

# Stage 3: Final Alpine image with dev tools
FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl nginx nodejs npm bash git
RUN adduser -D -s /bin/bash -u 1000 filebrowser
USER filebrowser
WORKDIR /home/filebrowser

# Copy Go binary
COPY --from=go-build --chown=filebrowser:filebrowser [ "/app/filebrowser", "./" ]

# Copy React SPA dist
COPY --from=frontend-build --chown=filebrowser:filebrowser [ "/app/dist/", "./dist/" ]

# Copy nginx config and entrypoint
COPY --chown=filebrowser:filebrowser _docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=filebrowser:filebrowser _docker/docker-entrypoint.sh ./

# Install serve globally
RUN npm install -g serve

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Copy source for debugging
COPY --chown=filebrowser:filebrowser ./backend/ ./backend-src/
COPY --chown=filebrowser:filebrowser ./frontend-next/ ./frontend-src/

# Sanity checks
RUN [ -f "filebrowser" ]
RUN [ -d "dist" ]

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
ENTRYPOINT [ "./docker-entrypoint.sh" ]
