FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --only=production

# Copy application code
COPY src/ ./src/

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash yieldbot
USER yieldbot

# Run the bot
CMD ["npm", "start"]
