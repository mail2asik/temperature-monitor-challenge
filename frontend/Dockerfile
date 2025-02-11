# Stage 1: Build the React app
FROM node:23-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies
COPY src/package.json src/package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY src/public ./public
COPY src/src ./src

# Build the React app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]