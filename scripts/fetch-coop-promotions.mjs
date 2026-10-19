import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const outputPath = resolve('src/coop-promotions.json');
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['--yes', '@nicktcode/swissgroceries-mcp'],
  stderr: 'inherit',
});
const client = new Client({ name: 'rezepte-coop-sync', version: '1.0.0' }, { capabilities: {} });

try {
  await client.connect(transport);
  const response = await client.callTool({
    name: 'get_promotions',
    arguments: { chains: ['coop'] },
  });
  if (response.isError) throw new Error('swissgroceries-mcp meldet einen Fehler beim Laden der Coop-Aktionen.');

  const textBlock = (response.content || []).find((part) => part.type === 'text');
  if (!textBlock?.text) throw new Error('Die Coop-Aktionen haben ein unerwartetes Antwortformat.');

  let payload;
  try { payload = JSON.parse(textBlock.text); }
  catch { throw new Error('Die Antwort der Coop-Aktionen war kein gültiges JSON.'); }

  const promotions = Array.isArray(payload) ? payload : payload.promotions;
  if (!Array.isArray(promotions) || promotions.length === 0) {
    throw new Error('Keine Coop-Aktionen zurückgegeben. Vorhandene Daten bleiben unverändert.');
  }

  const offers = promotions.map((p, i) => ({
    id: String(p.productId || p.id || i),
    name: String(p.productName || p.name || '').trim(),
    price: Number(p.price),
    unit: String(p.size || p.unit || ''),
    normalPrice: null,
    validUntil: String(p.validUntil || ''),
    discount: String(p.description || ''),
    productUrl: String(p.productUrl || ''),
    imageUrl: String(p.imageUrl || ''),
  })).filter((p) => p.name && Number.isFinite(p.price) && p.price >= 0);

  if (!offers.length) throw new Error('Keine verwertbaren Coop-Produkte gefunden. Vorhandene Daten bleiben unverändert.');

  const output = {
    source: 'swissgroceries-mcp',
    chain: 'coop',
    fetchedAt: new Date().toISOString(),
    count: offers.length,
    offers,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\\n');
  console.log(`Gespeichert: ${offers.length} Coop-Aktionen → ${outputPath}`);
} finally {
  await client.close().catch(() => {});
  await transport.close().catch(() => {});
}
