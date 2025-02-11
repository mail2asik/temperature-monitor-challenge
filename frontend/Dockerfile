# Stage 1: Build the React app
FROM node:23-alpine AS build

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies
COPY src/pnpm-lock.yaml ./
COPY src/package.json ./
RUN pnpm install

# Copy the rest of the application code
COPY src/. .

# Build the React app
RUN pnpm build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]