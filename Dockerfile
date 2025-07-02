# Step 1: Build frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Step 2: Build backend
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Step 3: Final production image
FROM node:20-alpine
WORKDIR /app

# Copy backend code
COPY --from=server-build /app/server /app/server

# Copy frontend build into server folder (served via Express)
COPY --from=client-build /app/client/dist /app/server/dist

WORKDIR /app/server

# Install dependencies just in case (optional if done earlier)
# RUN npm install

EXPOSE 5000

# Start the server (which serves both API and frontend)
CMD ["npm", "run", "serve"]
