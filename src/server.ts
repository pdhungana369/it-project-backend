import express, { Express, Response } from "express";
import { PrismaClient } from "./generated/client";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
// import compression from "compression";
import rootRouter from "./routes";

const app: Express = express();

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
// app.use(compression());
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1", rootRouter);
app.get("/", (_, res: Response) => {
  return res.status(200).send("server is running");
});

export const prismaClient = new PrismaClient();

prismaClient
  .$connect()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err: any) => console.log("Database error", err));

const PORT = process.env.PORT || 8989;

const port: number = Number(PORT);

const shutdown = () => {
  prismaClient.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(port, () => {
  console.log(`Node server is running on http://localhost:${port}`);
});
