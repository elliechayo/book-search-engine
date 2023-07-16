const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("savedBooks");

        return userData;
      }
      throw new AuthenticationError("You are not logged in!");
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      // if no user is found, throw error
      if (!user) {
        throw new AuthenticationError("Invalid credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Invalid credentials");
      }
      // create JWT using the user object from DB
      const token = signToken(user);

      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
      // if there's no user, throw error
      if (!context.user) {
        throw new AuthenticationError("You are not logged in!");
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: input } },
        { new: true }
      ).populate("savedBooks");

      return updatedUser;
    },
    removeBook: async (parent, { bookId }, context) => {
      // if there's no user, throw error
      if (!context.user) {
        throw new AuthenticationError("You are not logged in!");
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      ).populate("savedBooks");

      return updatedUser;
    },
  },
};

module.exports = resolvers;
