# Use Node.js LTS version
FROM node:22-alpine

# Install git, openssh (required for GitHub dependencies) and pnpm
RUN apk add --no-cache git openssh-client && npm install -g pnpm

# Accept GitHub token as build argument for private repo access
ARG GITHUB_TOKEN

# Configure git to use HTTPS with token instead of SSH for GitHub
RUN git config --global url."https://".insteadOf git:// && \
  if [ -n "$GITHUB_TOKEN" ]; then \
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf git@github.com:; \
  else \
  git config --global url."https://github.com/".insteadOf git@github.com:; \
  fi

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build the application
RUN pnpm run build

# Set production environment
ENV NODE_ENV=production

# Expose the server port (can be overridden at build time)
ARG SERVER_PORT=50051
EXPOSE ${SERVER_PORT}

# Start the application
CMD ["node", "dist/server.js"]
