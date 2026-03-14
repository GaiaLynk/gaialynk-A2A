import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface AgentCapability {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
  created_at: string;
}

interface RegisterAgentInput {
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
}

const agents = new Map<string, Agent>();

const normalizeAgentRow = (row: {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[] | string;
  created_at: string;
}): Agent => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    agent_type: row.agent_type,
    source_url: row.source_url,
    capabilities: typeof row.capabilities === "string" ? (JSON.parse(row.capabilities) as AgentCapability[]) : row.capabilities,
    created_at: row.created_at,
  };
};

export const registerAgent = (input: RegisterAgentInput): Agent => {
  if (isPostgresEnabled()) {
    throw new Error("Use registerAgentAsync in PostgreSQL mode");
  }

  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    created_at: new Date().toISOString(),
  };

  agents.set(agent.id, agent);

  return agent;
};

export const registerAgentAsync = async (input: RegisterAgentInput): Promise<Agent> => {
  if (!isPostgresEnabled()) {
    return registerAgent(input);
  }

  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    created_at: new Date().toISOString(),
  };

  await query(
    `INSERT INTO agents (id, name, description, agent_type, source_url, capabilities, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [agent.id, agent.name, agent.description, agent.agent_type, agent.source_url, JSON.stringify(agent.capabilities), agent.created_at],
  );

  return agent;
};

export const getAgentById = (agentId: string): Agent | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use getAgentByIdAsync in PostgreSQL mode");
  }

  return agents.get(agentId) ?? null;
};

export const getAgentByIdAsync = async (agentId: string): Promise<Agent | null> => {
  if (!isPostgresEnabled()) {
    return getAgentById(agentId);
  }

  const rows = await query<{
    id: string;
    name: string;
    description: string;
    agent_type: "logical" | "execution";
    source_url: string;
    capabilities: AgentCapability[];
    created_at: string;
  }>(
    `SELECT id, name, description, agent_type, source_url, capabilities, created_at::text
     FROM agents
     WHERE id = $1`,
    [agentId],
  );

  const row = rows[0];
  return row ? normalizeAgentRow(row) : null;
};

export const listAgents = (): Agent[] => {
  if (isPostgresEnabled()) {
    throw new Error("Use listAgentsAsync in PostgreSQL mode");
  }

  return [...agents.values()];
};

export const listAgentsAsync = async (): Promise<Agent[]> => {
  if (!isPostgresEnabled()) {
    return listAgents();
  }

  const rows = await query<{
    id: string;
    name: string;
    description: string;
    agent_type: "logical" | "execution";
    source_url: string;
    capabilities: AgentCapability[];
    created_at: string;
  }>(
    `SELECT id, name, description, agent_type, source_url, capabilities, created_at::text
     FROM agents
     ORDER BY created_at DESC`,
  );

  return rows.map(normalizeAgentRow);
};

export const resetAgentStore = (): void => {
  agents.clear();
};
