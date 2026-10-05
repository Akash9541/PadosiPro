
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

RUN npm rebuild bcrypt --build-from-source

RUN npx prisma generate && npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
