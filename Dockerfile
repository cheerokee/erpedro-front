# --- FASE 1: BUILD ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# --- FASE 2: PRODUÇÃO (Runtime) ---
FROM node:22-alpine AS production

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist/cuba-angular/browser ./browser

EXPOSE 3000

CMD ["sh", "-c", "serve -s browser -l ${PORT:-3000}"]
