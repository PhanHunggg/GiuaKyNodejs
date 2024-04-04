import bodyParser from "body-parser";
import express from "express";
import { MongoClient } from "mongodb";
const DATABASE_NAME = "cs193x_assign3";
import cors from "cors";
const dbConnect = await MongoClient.connect("mongodb://localhost:27017");
const db = dbConnect.db(DATABASE_NAME);
const usersCollection = db.collection("users");
const postsCollection = db.collection("posts");
const api = new express.Router();

const initApi = (app) => {
  app.use(cors());
  app.set("json spaces", 2);
  app.use("/api", api);
};

api.use(bodyParser.json());

api.get("/", (req, res) => {
  res.json({ db: "local_api", numUsers: 1, numPosts: 1 });
});

api.get("/tests/get", (req, res) => {
  let value = req.query.value || null;
  res.json({ success: true, value });
});

api.post("/tests/post", (req, res) => {
  let value = req.body.value || null;
  res.json({ success: true, value });
});

api.get("/tests/error", (req, res) => {
  res.status(499).json({ error: "Test error" });
});

api.all("/tests/echo", (req, res) => {
  res.json({
    method: req.method,
    query: req.query,
    body: req.body,
  });
});

api.get("/users", (req, res) => {
  res.json({ users: ["mchang"] });
});

// middleware
api.use("/users/:id", async (req, res, next) => {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    res.status(404).json({ error: "Unknown user" });
    return;
  }
  req.user = user;
  next();
});

api.get("/users/:id", async (req, res) => {
  const user = req.user;
  console.log(user);
  return res.json(user);
});

api.get("/users/:id/feed", async (req, res) => {
  const user = req.user;

  const posts = await postsCollection
    .find({
      userId: user.id,
    })
    .toArray();
  return res.json({
    posts,
  });
});

api.post("/users/:id/posts", async (req, res) => {
  const text = req.body.text;
  const userId = req.params.id;

  await postsCollection.insertOne({
    userId,
    time: new Date(),
    text,
  });
  res.status(200).json({ success: true, message: "Post created successfully" });
});

api.patch("/users/:id/follow", async (req, res) => {
  try {
    const id = req.body.id;
    const userId = req.params.id;
    const user = req.user;

    if (id === userId) return res.status(400).json({ message: "Error" });

    const checkUser = usersCollection.findOne({
      id,
    });

    if (!checkUser) return res.status(404).json({ message: "Not found!" });

    const isValid = user.following.find((ele) => ele === id);

    if (isValid)
      return res.status(409).json({ message: "Followed this person!" });

    await usersCollection.findOneAndUpdate(
      {
        id: userId,
      },
      {
        $set: {
          following: [...user.following, id],
        },
      }
    );

    return res.status(200).json({ success: true, message: "Followed!" });
  } catch (error) {
    throw new Error(error.message);
  }
});
api.patch("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = req.body;

    await usersCollection.findOneAndUpdate(
      {
        id: userId,
      },
      {
        $set: {
          name: user.name,
          avatarURL: user.avatarURL,
        },
      }
    );

    return res.status(200).json({ success: true, message: "Success!" });
  } catch (error) {
    throw new Error(error.message);
  }
});

api.delete("/users/:id/follow", async (req, res) => {
  try {
    const id = req.body.id;
    const userId = req.params.id;
    const user = req.user;

    if (id === userId) return res.status(400).json({ message: "Error" });

    const isValid = user.following.find((ele) => ele === id);

    if (!isValid) return res.status(404).json({ message: "Not Found" });

    const index = user.following.findIndex((ele) => ele === id);

    user.following.splice(index, 1);

    await usersCollection.findOneAndUpdate(
      {
        id: userId,
      },
      {
        $set: {
          following: user.following,
        },
      }
    );

    return res.status(200).json({ success: true, message: "Followed!" });
  } catch (error) {
    throw new Error(error.message);
  }
});

/* This is a catch-all route that logs any requests that weren't handled above.
   Useful for seeing whether other requests are coming through correctly */
api.all("/*", (req, res) => {
  let data = {
    method: req.method,
    path: req.url,
    query: req.query,
    body: req.body,
  };
  console.log(data);
  res.status(500).json({ error: "Not implemented" });
});

export default initApi;
