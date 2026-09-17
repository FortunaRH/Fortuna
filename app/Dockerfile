# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Public config is inlined into the client bundle at build time.
ARG NEXT_PUBLIC_ENTROPY_ADDRESS
ARG NEXT_PUBLIC_COINFLIP_ADDRESS
ARG NEXT_PUBLIC_PROVIDER_ADDRESS
ARG NEXT_PUBLIC_NFT_ADDRESS
ARG NEXT_PUBLIC_POOL_ADDRESS
ARG NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_ENTROPY_ADDRESS=$NEXT_PUBLIC_ENTROPY_ADDRESS
ENV NEXT_PUBLIC_COINFLIP_ADDRESS=$NEXT_PUBLIC_COINFLIP_ADDRESS
ENV NEXT_PUBLIC_PROVIDER_ADDRESS=$NEXT_PUBLIC_PROVIDER_ADDRESS
ENV NEXT_PUBLIC_NFT_ADDRESS=$NEXT_PUBLIC_NFT_ADDRESS
ENV NEXT_PUBLIC_POOL_ADDRESS=$NEXT_PUBLIC_POOL_ADDRESS
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL

RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
