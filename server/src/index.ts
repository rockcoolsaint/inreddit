import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants"; 
import microConfig from './mikro-orm.config'
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from "./resolvers/hello";
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import { createClient } from "redis";
import connectRedis from "connect-redis";
import dotenv from "dotenv";
import { MyContext } from "./types";

dotenv.config();

// let RedisStore = connectRedis(session)

// // redis@v4
// let redisClient = createClient({ legacyMode: true })
// redisClient.connect().catch(console.error)


// app.use(
//   session({
//     store: new RedisStore({ client: redisClient }),
//     saveUninitialized: false,
//     secret: "keyboard cat",
//     resave: false,
//   })
// )

const main = async () => {
  const orm = await MikroORM.init(microConfig);  
  orm.getMigrator().up();

  const app = express();

  let RedisStore = connectRedis(session)

  // redis@v4
  let redisClient = createClient({ legacyMode: true })
  redisClient.connect().catch(console.error)


  app.use(
    session({
      name: 'qid',
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https. Turn this off if not using https in production
      },
      saveUninitialized: false,
      secret: process.env.REDIS_SECRET as any,
      resave: false,
    })
  )
  // 
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
    plugins: [ ApolloServerPluginLandingPageGraphQLPlayground() ]
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('server started on localhost:4000');
  });
};

main().catch((err) => {
  console.error(err);
});


// console.log("hello world");