FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Set the port environment variable and start the server
ENV PORT=3001
CMD ["npx", "next", "start", "-p", "3001"]
