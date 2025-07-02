# ---- Build client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# ---- Build server ----
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .  # Removed `npm run build` unless it's actually needed

# ---- Final image ----
FROM node:20-alpine
WORKDIR /app

# Copy server code
COPY --from=server-build /app/server /app/server

# Copy built frontend
COPY --from=client-build /app/client/dist /app/server/dist

WORKDIR /app/server
EXPOSE 5000
CMD ["npm", "run", "serve"]
