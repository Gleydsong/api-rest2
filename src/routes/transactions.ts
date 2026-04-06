import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { knex } from "../database.js";

export async function transactionsRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    );

    let sessionId = request.headers.cookie
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sessionId="))
      ?.split("=")[1];

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      reply.header("Set-Cookie", `sessionId=${sessionId}; Path=/; HttpOnly`);
    }

    const transaction = await knex("transactions").insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      title,
      amount: type === "credit" ? amount : amount * -1,
    });

    return reply.status(201).send(transaction);
  });

  app.get("/transactions", async (request, reply) => {
    const transactions = await knex("transactions").select("*");

    return reply.status(200).send(transactions);
  });
}
