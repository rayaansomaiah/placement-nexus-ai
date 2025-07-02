# ----------- Step 1: Build React frontend -------------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build


# ----------- Step 2: Build TypeScript backend -------------
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Compile TypeScript (assumes "build" script does `tsc`)
RUN npm run build


# ----------- Step 3: Final image ---------------------
FROM node:20-alpine
WORKDIR /app

# Copy compiled backend
COPY --from=server-build /app/server/dist /app/server/dist

# Copy backend node_modules
COPY --from=server-build /app/server/node_modules /app/server/node_modules

# Copy any other necessary server files (e.g., .env, uploads)
COPY --from=server-build /app/server/package*.json /app/server/

# Copy frontend build into backend
COPY --from=client-build /app/client/dist /app/server/dist/client

WORKDIR /app/server

EXPOSE 5000

ENV NODE_ENV=production
# Start the compiled backend (adjust if output isn't dist/index.js)
CMD ["node", "dist/index.js"]
