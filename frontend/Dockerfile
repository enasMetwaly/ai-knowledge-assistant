# frontend/Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (production-only)
RUN npm ci 

# Copy all source code
COPY . .

#  Critical: Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]