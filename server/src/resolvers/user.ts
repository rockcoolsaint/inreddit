import { RequiredEntityData } from "@mikro-orm/core";
import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, Mutation, InputType, Field, Ctx, Arg, ObjectType, Query } from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;

}

@Resolver()
export class UserResolver {
  // @Query(() => [User])
  // users(@Ctx() {em}: MyContext): Promise<User[]> {
  //   return em.find(User, {});
  // }

  // @Query(() => User, {nullable: true})
  // user(
  // @Arg('id') id: number,
  // @Ctx() {em}: MyContext): Promise<User | null> {
  //   return em.findOne(User, { id })
  // }
  @Query(() => User, {nullable: true})
  async me(
    @Ctx() { req, em }: MyContext
  ){
    console.log("session: ", req.session);
    // you are not logged in
    if (!req.session.userId) {
      return null
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em, req}: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: 'username',
          message: "length must be greater than 2",
        }]
      }
    }

    if (options.password.length <= 3) {
      return {
        errors: [{
          field: 'password',
          message: "length must be greater than 3",
        }]
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword
    } as RequiredEntityData<User>);
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      // || err.details.includes("already exists")
      // duplicate username error
      if (err.code === "23505") {
        return {
          errors: [{
            field: "username",
            message: "username already taken",
          }]
        }
      }
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session!.userId = user.id;

    return {
      user
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em, req}: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username});
    if (!user) {
      return {
        errors: [{
          field: 'username',
          message: "that username doesn't exist",
        }]
      }
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ]
      }
    }

    req.session!.userId = user.id;

    return {
      user
    };
  }
}