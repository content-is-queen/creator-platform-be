import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const start = () => {
  try {
    app.listen({ port: PORT }, () =>
      process.stdout.write(`http://localhost:${PORT} \n`),
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

start();
