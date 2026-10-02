import { prisma } from "./prisma";

export type NotificationType =
  | "welcome"
  | "lesson_completed"
  | "module_completed"
  | "course_finished"
  | "badge_awarded"
  | "order_created"
  | "order_paid"
  | "order_failed"
  | "order_shipped"
  | "order_cancelled";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });
}

export async function ensureWelcomeNotification(userId: string, name?: string | null) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "welcome" },
    select: { id: true },
  });
  if (existing) return existing;
  const greet = name?.trim() ? `, ${name.trim().split(/\s+/)[0]}` : "";
  return createNotification({
    userId,
    type: "welcome",
    title: `Bem-vinda${greet}!`,
    body: "Sua área na Esmalt'up está pronta. Explore o curso e complete seu perfil.",
    href: "/curso",
  });
}

/** Order lifecycle notifications — never throws, never blocks the order flow. */
export async function notifyOrderEvent(input: {
  userId: string | null | undefined;
  kind: "order_created" | "order_paid" | "order_failed" | "order_shipped" | "order_cancelled";
  orderId: string;
  kitName?: string | null;
}) {
  if (!input.userId) return;
  const kit = input.kitName ? ` do pedido “${input.kitName}”` : "";
  const map = {
    order_created: {
      title: "Pedido recebido",
      body: `Recebemos seu pedido${kit}. Aguardando pagamento.`,
    },
    order_paid: {
      title: "Pagamento confirmado",
      body: `Seu pedido${kit} foi pago e está sendo preparado.`,
    },
    order_failed: {
      title: "Falha no pagamento",
      body: `Não foi possível confirmar o pagamento${kit}. Tente novamente.`,
    },
    order_shipped: {
      title: "Pedido enviado",
      body: `Seu pedido${kit} foi enviado. Acompanhe o rastreio.`,
    },
    order_cancelled: {
      title: "Pedido cancelado",
      body: `Seu pedido${kit} foi cancelado.`,
    },
  } as const;
  const { title, body } = map[input.kind];
  try {
    await createNotification({
      userId: input.userId,
      type: input.kind,
      title,
      body,
      href: `/pedidos`,
    });
  } catch (error) {
    console.error("[notifications] notifyOrderEvent", error);
  }
}
