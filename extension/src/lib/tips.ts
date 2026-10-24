import type { FeatureId } from './paywall';
import type { PageSignals } from './extract';

export interface Tip {
  id: string;
  feature: FeatureId;
  title: string;
  detail: string;
  toolId?: string;
  action?: string;
}

export function detectTips(signals: PageSignals): Tip[] {
  const tips: Tip[] = [];
  if (signals.tableCount > 0) {
    const noun = signals.tableCount === 1 ? 'a table' : `${signals.tableCount} tables`;
    tips.push({
      id: 'table',
      feature: 'table-csv',
      title: 'Export this table',
      detail: `This page has ${noun}. You can save it as CSV or Excel.`,
      action: 'tables',
    });
  }
  if (signals.isPdf || signals.pdfLinkCount > 0) {
    tips.push({
      id: 'pdf',
      feature: 'send-pdfs',
      title: 'PDF on this page',
      detail: 'Merge or compress the PDF from here, or open the full PDF tool.',
      toolId: 'pdf-tools',
      action: 'pdfs',
    });
  }
  if (signals.wordCount >= 700) {
    tips.push({
      id: 'long',
      feature: 'ai-summarize',
      title: 'Long document',
      detail: `About ${signals.wordCount.toLocaleString('en-US')} words. Summarize it on this device with Pro.`,
      action: 'summarize',
    });
  }
  if (signals.looksLikeInvoice) {
    tips.push({
      id: 'invoice',
      feature: 'prefill-invoice',
      title: 'Looks like an invoice',
      detail: 'Start a clean invoice from the text on this page.',
      toolId: 'invoice',
      action: 'invoice',
    });
  }
  if (signals.imageCount >= 4) {
    tips.push({
      id: 'images',
      feature: 'send-images',
      title: 'Several images',
      detail: 'Send the images on this page to the compressor.',
      toolId: 'image-compress',
      action: 'images',
    });
  }
  return tips;
}

export function visibleTips(tips: Tip[], opts: { disabled?: boolean; dismissed?: string[] }): Tip[] {
  if (opts.disabled) return [];
  const dismissed = new Set(opts.dismissed || []);
  return tips.filter((tip) => !dismissed.has(tip.id));
}

export function tipTeaser(tips: Tip[]): string | null {
  const first = tips[0];
  if (!first) return null;
  if (tips.length === 1) return `Pro tip for this page: ${first.title}.`;
  return `Pro tips for this page: ${tips.map((tip) => tip.title).join(', ')}.`;
}
