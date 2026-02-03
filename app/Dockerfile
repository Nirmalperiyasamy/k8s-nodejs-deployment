# Use official Node.js 22 Alpine (smaller size)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Use npm ci instead of npm install (faster, more reliable)
RUN npm ci --only=production

# Copy application code
COPY server.js ./

# Expose port
EXPOSE 3000

# Run as non-root user (security)
USER node

# Start application
CMD ["node", "server.js"]