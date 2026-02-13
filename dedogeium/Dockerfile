FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
ENV DATA_DIR=/data

VOLUME ["/data"]

EXPOSE 3000

# Install curl for healthcheck
RUN apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
