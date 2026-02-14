export interface AgentDefinition {
  id: string;
  name: string;
  instructions: string;
  model?: {
    provider: string;
    name: string;
    toolChoice?: 'auto' | 'required' | 'none';
  };
  tools?: string[];
  workflows?: string[];
  agents?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: string[];
}

export interface ToolDefinition<TInput = unknown, TResult = unknown> {
  id: string;
  description: string;
  execute: (input: TInput) => Promise<TResult>;
}

export interface MastraRuntimeConfig {
  telemetryEnabled?: boolean;
}
