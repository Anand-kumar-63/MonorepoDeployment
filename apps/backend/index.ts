import express from "express";
import cors from "cors";
import { prismaClient } from "@repo/db";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.get("/users", async (req, res) => {
  try {
    const users = await prismaClient.user.findMany();
    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "username and password required",
      });
    }

    const user = await prismaClient.user.create({
      data: {
        username,
        password,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(4000,()=>{
    console.log(`server is listening on http://localhost:${4000}`);
})