FROM node:22.13

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# CMD ["npm", "run", "dev"]
# CMD ["npm", "next" , "dev", "--experimental-https", "-p 3002", "--turbopack"]
# CMD ["npx", "next", "dev", "--turbopack", "-p 80"]
RUN cp -r public .next/standalone/
RUN cp -r .next/static .next/standalone/.next/

CMD ["node", ".next/standalone/server.js"]
