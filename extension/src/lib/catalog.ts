import raw from '../../../tools.json';

export interface Tool {
  id: string;
  name: string;
  summary: string;
  category: string;
  url: string;
  description: string;
}

interface RawTool {
  id: string;
  name: string;
  summary: string;
  category: string;
  url: string;
  description: string;
}

const data = raw as { tools: RawTool[] };

export const tools: Tool[] = data.tools.map((t) => ({
  id: t.id,
  name: t.name,
  summary: t.summary,
  category: t.category,
  url: t.url,
  description: t.description,
}));

export const categories: string[] = [...new Set(tools.map((t) => t.category))];

export function toolById(id: string): Tool | null {
  return tools.find((t) => t.id === id) ?? null;
}

export function websiteUrl(id: string): string {
  return toolById(id)?.url ?? `https://greaterworldmedia.tech/${id}/`;
}
