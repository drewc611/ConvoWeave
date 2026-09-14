FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    CONVOWEAVE_DATA_DIR=/data/convoweave

COPY backend/package.json ./package.json
COPY backend/*.mjs ./
COPY backend/providers ./providers
COPY backend/storage ./storage

RUN mkdir -p /data/convoweave && chown -R node:node /data/convoweave

VOLUME ["/data/convoweave"]

USER node

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
