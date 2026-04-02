FROM node:22-alpine

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

# Next.js reads PORT and HOSTNAME env vars automatically
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
