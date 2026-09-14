FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY server.mjs tools.mjs ./
ENV HOST=0.0.0.0
ENV PORT=8790
EXPOSE 8790
USER node
CMD ["node", "server.mjs"]
