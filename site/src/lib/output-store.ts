/**
 * Detection logic for whether an output has a rich visualization available.
 */

const RICH_VIZ_TYPES = new Set([
  "tensor",
  "autograd",
  "neuron",
  "attention",
  "mlp",
]);

const RICH_VIZ_OPS = new Set([
  "attention_forward",
  "autograd_expr",
  "autograd_neuron",
  "mlp_forward",
  "autograd_neuron_tensor",
]);

export function detectHasRichViz(output: string, type: string): boolean {
  if (RICH_VIZ_TYPES.has(type)) return true;
  try {
    const parsed = JSON.parse(output);
    if (parsed?.op && RICH_VIZ_OPS.has(parsed.op)) return true;
    if (parsed?.attention_weights) return true;
    if (parsed?.layers && Array.isArray(parsed.layers)) return true;
    if (parsed?.values && Array.isArray(parsed.values) && parsed.values[0]?.grad !== undefined) return true;
    if (parsed?.output !== undefined && parsed?.weights && parsed?.inputs) return true;
  } catch { /* not JSON */ }
  return false;
}
