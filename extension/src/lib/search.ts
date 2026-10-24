import { tools, type Tool } from './catalog';

export function searchTools(query: string, category = 'all', source: Tool[] = tools): Tool[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return source.filter((tool) => {
    if (category !== 'all' && tool.category !== category) return false;
    if (!words.length) return true;
    const hay = `${tool.name} ${tool.summary} ${tool.description} ${tool.category} ${tool.id}`.toLowerCase();
    return words.every((word) => hay.includes(word));
  });
}
