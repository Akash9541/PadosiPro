FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate && npm run build

ENV NODE_ENV=production

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
