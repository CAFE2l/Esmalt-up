import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "@/lib/catalogData.static";

const prisma = new PrismaClient();

/**
 * Seed de pedidos de demonstração para validar a página /pedidos.
 *
 * Uso: SEED_USER_UID=<uid-do-firebase> npm run seed:orders
 * (opcional) SEED_ORDER_STATUS_PREFIX=dev  → sufixo nos ids para não duplicar.
 *
 * Cria pedidos em vários status (aguardando_pagamento, pago, em_preparo,
 * enviado, entregue, falha_pagamento) apontando para produtos reais do catálogo.
 */

const USER_UID = process.env.SEED_USER_UID;

interface DemoOrder {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  kitName: string;
  daysAgo: number;
  productSlugs: string[];
  shipped?: boolean;
  delivered?: boolean;
}

const DEMO_ORDERS: DemoOrder[] = [
  {
    status: "aguardando_pagamento",
    paymentStatus: "pending",
    paymentMethod: "pix",
    kitName: "Kit Iniciante Glow +1 item",
    daysAgo: 1,
    productSlugs: ["kit-iniciante", "peca-top-coat"],
  },
  {
    status: "pago",
    paymentStatus: "paid",
    paymentMethod: "card",
    kitName: "Kit Profissional Esmalt'up",
    daysAgo: 3,
    productSlugs: ["kit-profissional"],
  },
  {
    status: "em_preparo",
    paymentStatus: "paid",
    paymentMethod: "pix",
    kitName: "Kit Completo Cabine +2 itens",
    daysAgo: 5,
    productSlugs: ["kit-completo", "peca-lixas", "peca-brocas"],
  },
  {
    status: "enviado",
    paymentStatus: "paid",
    paymentMethod: "boleto",
    kitName: "Kit Alongamento Premium",
    daysAgo: 8,
    productSlugs: ["kit-alongamento"],
    shipped: true,
  },
  {
    status: "entregue",
    paymentStatus: "paid",
    paymentMethod: "pix",
    kitName: "Kit Iniciante +3 itens",
    daysAgo: 20,
    productSlugs: ["kit-iniciante", "peca-lixas", "peca-alicate", "peca-top-coat"],
    shipped: true,
    delivered: true,
  },
  {
    status: "falha_pagamento",
    paymentStatus: "failed",
    paymentMethod: "card",
    kitName: "Kit Profissional +1 item",
    daysAgo: 30,
    productSlugs: ["kit-profissional", "peca-brocas"],
  },
];

async function seedOrders() {
  if (!USER_UID) {
    console.error(
      "❌ Defina SEED_USER_UID com o uid Firebase do usuário de teste.\n" +
        "   Ex.: SEED_USER_UID=abc123 npm run seed:orders",
    );
    process.exit(1);
  }

  console.log(`🌱 Seeding demo orders for uid=${USER_UID}...`);

  // Garante o perfil (FK obrigatória de Order.userId → UserProfile.uid).
  await prisma.userProfile.upsert({
    where: { uid: USER_UID },
    create: { uid: USER_UID, interests: [], badges: [] },
    update: {},
    select: { uid: true },
  });

  for (const demo of DEMO_ORDERS) {
    const createdAt = new Date(Date.now() - demo.daysAgo * 24 * 60 * 60 * 1000);

    // Id determinístico (prefixed) para permitir re-execução sem duplicar.
    const id = `demo_${demo.status}_${createdAt.getTime().toString(36)}`;

    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });
    if (existing) {
      console.log(`  ⏭️  Já existe: ${demo.status} (${id})`);
      continue;
    }

    const lines: { productId: string; productName: string; priceCents: number; quantity: number }[] = [];
    for (const [index, slug] of demo.productSlugs.entries()) {
      const product = await prisma.product.findUnique({
        where: { slug },
        select: { id: true, name: true, priceCents: true },
      });
      if (!product) {
        console.log(`  ⚠️  Produto não encontrado: ${slug} (rode npm run seed:products)`);
        continue;
      }
      lines.push({
        productId: product.id,
        productName: product.name,
        priceCents: product.priceCents,
        quantity: 1 + (index % 2),
      });
    }

    if (lines.length === 0) {
      console.log(`  ⚠️  Pulando pedido ${demo.status}: nenhum produto encontrado.`);
      continue;
    }

    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.priceCents * line.quantity,
      0,
    );
    const shippingCents = subtotalCents > 20000 ? 0 : 1590;
    const totalCents = subtotalCents + shippingCents;

    const address = await prisma.address.create({
      data: {
        userId: USER_UID,
        cep: "01310-100",
        logradouro: "Av. Paulista",
        numero: "1000",
        complemento: "Apto 101",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
      },
    });

    await prisma.order.create({
      data: {
        id,
        userId: USER_UID,
        addressId: address.id,
        customerName: "Conta de demonstração",
        email: "demo@esmaltup.dev",
        kitName: demo.kitName,
        status: demo.status,
        createdAt,
        subtotalCents,
        shippingCents,
        discountCents: 0,
        totalCents,
        paymentMethod: demo.paymentMethod,
        paymentStatus: demo.paymentStatus,
        trackingCode: demo.shipped ? `ESM${createdAt.getTime().toString(10).slice(-10)}` : null,
        shippedAt: demo.shipped ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        deliveredAt: demo.delivered ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        items: {
          create: lines.map((line) => ({ ...line, variant: null })),
        },
      },
    });
    console.log(`  ✅ Pedido criado: ${demo.status} — ${demo.kitName}`);
  }

  console.log("✨ Demo orders seeded successfully!");
}

seedOrders()
  .catch((error) => {
    console.error("❌ Error seeding orders:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
