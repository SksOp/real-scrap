# Use the official Node.js image from the Docker Hub
FROM node:20.13.1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your app runs on (optional)
EXPOSE 3000

# Define the command to run your application
CMD ["node", "server.js"]
