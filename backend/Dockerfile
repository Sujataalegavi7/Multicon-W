# Base node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for lean image)
RUN npm ci --only=production

# Copy application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
