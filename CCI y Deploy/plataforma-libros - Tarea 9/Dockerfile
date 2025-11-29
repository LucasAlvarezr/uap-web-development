# Etapa 1: Construir la aplicación
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

# Etapa 2: Servir la aplicación
FROM node:18-alpine

WORKDIR /app

# Copiar los archivos esenciales de la etapa de construcción
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
