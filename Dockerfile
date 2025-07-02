FROM node:20-alpine

# Set working directory to root of the project
WORKDIR /app

# Copy root package.json and lock (if any)
COPY package*.json ./

# Install root dependencies (if using a monorepo tool like `concurrently`)
RUN npm install

# Copy the full project (client + server)
COPY client/ ./client
COPY server/ ./server

# Install dependencies in client and server
RUN cd client && npm install
RUN cd server && npm install

# Expose dev ports if needed (adjust as per client/server config)
EXPOSE 5000

# Run dev command from root
CMD ["npm", "run", "dev"]
