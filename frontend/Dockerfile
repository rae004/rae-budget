FROM node:24-alpine

WORKDIR /app

# pnpm is pinned in package.json's "packageManager" field; corepack
# activates that exact version.
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare --activate

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

# --host binds Vite to 0.0.0.0 so the dev server is reachable from the host.
CMD ["pnpm", "run", "dev", "--host"]
