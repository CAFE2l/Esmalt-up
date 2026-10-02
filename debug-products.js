// Debug script to check what products are returned
const { prisma } = require('./lib/prisma');

async function debug() {
  console.log('=== Checking database products ===');
  
  const allProducts = await prisma.product.findMany();
  console.log('Total products in DB:', allProducts.length);
  
  const kits = await prisma.product.findMany({
    where: {
      kind: 'kit',
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Kits (active):', kits.length);
  console.log('Kit IDs:', kits.map(k => k.id));
  
  const pecas = await prisma.product.findMany({
    where: {
      kind: 'peca',
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Peças (active):', pecas.length);
  console.log('Peça IDs:', pecas.map(p => p.id));
  
  const featuredKits = await prisma.product.findMany({
    where: {
      kind: 'kit',
      featured: true,
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Featured Kits:', featuredKits.length);
  
  process.exit(0);
}

debug().catch(console.error);