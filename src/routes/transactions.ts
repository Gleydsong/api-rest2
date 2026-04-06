import type { FastifyInstance } from "fastify";
import { knex } from "../database.js";
import crypto from "node:crypto";
import { z } from "zod";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const transactions = await knex("transactions").select();

    return { transactions };
  });

  app.get("/:id", async (request, reply) => {
    const getTransactionsParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionsParamsSchema.parse(request.params);

    const transaction = await knex("transactions").where("id", id).first();

    return { transaction };
  });

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    const transaction = await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
