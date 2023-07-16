// environmental variables
const PORT = process.env.PORT || 3001;

// packages
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const path = require("path");
const db = require("./config/connection");
const { authMiddleware } = require("./utils/auth");
const { typeDefs, resolvers } = require("./schemas");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Apollo server init
const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();

  // apply our express app as a middleware to the apollo server
  server.applyMiddleware({ app });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/build")));
  }

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });

  // start the server once db is connected
  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`Server listening on *:${PORT}`);
      console.log(
        `Graphql server at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

startApolloServer(typeDefs, resolvers);
