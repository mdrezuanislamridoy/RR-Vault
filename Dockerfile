FROM node:20-alpine

WORKDIR /app


COPY prisma.config.ts ./
COPY pnpm-lock.yaml package.json ./
COPY prisma ./prisma


RUN npm install --frozen-lockfile

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 8888

CMD [ "npm" ,"run", "start:dev" ]