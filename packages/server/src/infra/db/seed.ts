import { randomUUID } from "node:crypto";
import { closePool, getPool } from "./client";

const nowIso = (): string => new Date().toISOString();

const seedDatabase = async (): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is required to seed database");
  }

  const conversationId = randomUUID();
  const agentId = randomUUID();
  const participantId = randomUUID();
  const userMessageId = randomUUID();
  const agentMessageId = randomUUID();
  const timestamp = nowIso();

  await pool.query(
    `INSERT INTO conversations (id, title, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [conversationId, "Seed Conversation", "active", timestamp, timestamp],
  );

  await pool.query(
    `INSERT INTO agents (id, name, description, agent_type, source_url, capabilities, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      agentId,
      "Seed Agent",
      "Demo seed agent",
      "logical",
      "https://seed.example.com/agent",
      JSON.stringify([{ name: "summarize", risk_level: "low" }]),
      timestamp,
    ],
  );

  await pool.query(
    `INSERT INTO participants (id, conversation_id, participant_type, participant_id, role, joined_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [participantId, conversationId, "agent", agentId, "member", timestamp],
  );

  await pool.query(
    `INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6),
            ($7, $2, $8, $9, $10::jsonb, $6)`,
    [
      userMessageId,
      conversationId,
      "user",
      "seed-user",
      JSON.stringify({ type: "text", text: "Seed user message" }),
      timestamp,
      agentMessageId,
      "agent",
      agentId,
      JSON.stringify({ type: "text", text: "Seed agent reply" }),
    ],
  );

  console.log("database seed completed");
};

seedDatabase()
  .then(async () => {
    await closePool();
  })
  .catch(async (error: unknown) => {
    console.error("database seed failed", error);
    await closePool();
    process.exitCode = 1;
  });
