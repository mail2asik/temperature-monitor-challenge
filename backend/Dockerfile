# Use the official Node.js image as a base
FROM node:23-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY src/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src/bin ./bin
COPY src/models ./models
COPY src/public ./public
COPY src/routes ./routes
COPY src/views ./views
COPY src/.env ./.env
COPY src/app.js ./app.js

# Expose the port the app runs on
EXPOSE 3000

# Expose the port the socket runs on
EXPOSE 4000

# Define the command to run the app
CMD ["node", "./bin/www"]