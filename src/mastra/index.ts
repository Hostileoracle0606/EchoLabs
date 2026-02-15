import type { AgentDefinition, MastraRuntimeConfig, ToolDefinition, WorkflowDefinition } from './types';
import { salesDirectorAgent } from './agents/sales-director';
import { productExpertAgent } from './agents/product-expert';
import { objectionHandlerAgent } from './agents/objection-handler';
import { qualifierAgent } from './agents/qualifier-agent';
import { closingAgent } from './agents/closing-agent';
import { negotiatorAgent } from './agents/negotiator-agent';
import { discoveryWorkflow } from './workflows/discovery-workflow';
import { demoWorkflow } from './workflows/demo-workflow';
import { objectionWorkflow } from './workflows/objection-workflow';
import { closingWorkflow } from './workflows/closing-workflow';
import {
  updateCrmTool,
  fetchCrmContextTool,
  searchKnowledgeBaseTool,
  prefetchKnowledgeTool,
  scheduleMeetingTool,
  updateAnalyticsTool,
  pricingTool,
  detectBuyingSignalsTool,
  detectObjectionTool,
} from './tools';

export interface MastraGenerateInput {
  agentId: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  threadId: string;
  resourceId?: string;
}

export interface MastraGenerateOutput {
  text: string;
  metadata?: Record<string, unknown>;
}

export class MastraRuntime {
  private agents = new Map<string, AgentDefinition>();
  private workflows = new Map<string, WorkflowDefinition>();
  private tools = new Map<string, ToolDefinition>();
  private config: MastraRuntimeConfig;

  constructor(config: MastraRuntimeConfig = {}) {
    this.config = config;
  }

  registerAgent(agent: AgentDefinition) {
    this.agents.set(agent.id, agent);
  }

  registerWorkflow(workflow: WorkflowDefinition) {
    this.workflows.set(workflow.id, workflow);
  }

  registerTool(tool: ToolDefinition<any, any>) {
    this.tools.set(tool.id, tool);
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  async generate(input: MastraGenerateInput): Promise<MastraGenerateOutput> {
    // TODO: Replace with Mastra.ai SDK call and tool execution.
    void input;
    return {
      text: '',
      metadata: {},
    };
  }

  getConfig(): MastraRuntimeConfig {
    return this.config;
  }
}

const globalForMastra = global as unknown as { mastraRuntime?: MastraRuntime };

export function getMastraRuntime(): MastraRuntime {
  if (!globalForMastra.mastraRuntime) {
    const runtime = new MastraRuntime({ telemetryEnabled: true });
    runtime.registerAgent(salesDirectorAgent);
    runtime.registerAgent(productExpertAgent);
    runtime.registerAgent(objectionHandlerAgent);
    runtime.registerAgent(qualifierAgent);
    runtime.registerAgent(closingAgent);
    runtime.registerAgent(negotiatorAgent);

    runtime.registerWorkflow(discoveryWorkflow);
    runtime.registerWorkflow(demoWorkflow);
    runtime.registerWorkflow(objectionWorkflow);
    runtime.registerWorkflow(closingWorkflow);

    runtime.registerTool(updateCrmTool);
    runtime.registerTool(fetchCrmContextTool);
    runtime.registerTool(searchKnowledgeBaseTool);
    runtime.registerTool(prefetchKnowledgeTool);
    runtime.registerTool(scheduleMeetingTool);
    runtime.registerTool(updateAnalyticsTool);
    runtime.registerTool(pricingTool);
    runtime.registerTool(detectBuyingSignalsTool);
    runtime.registerTool(detectObjectionTool);

    globalForMastra.mastraRuntime = runtime;
  }

  return globalForMastra.mastraRuntime;
}
