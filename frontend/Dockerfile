# ---------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ---------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application source code and build for production
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production Nginx Server
# ---------------------------------------------------------------------------
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
