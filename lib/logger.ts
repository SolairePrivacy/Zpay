import pino from "pino";
import { env } from "./env";

const level = env.NODE_ENV === "production" ? "info" : "debug";

export const logger = pino({
  name: "zpay",
  level,
});

export type Logger = typeof logger;

