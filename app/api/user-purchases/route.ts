import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

// GET /api/user-purchases?productId=xxx - Check if current user purchased a specific product
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    
    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório." },
        { status: 400 },
      );
    }

    // Authenticate user
    const auth = await authenticateRequest(req);
    
    if (!auth.ok || !auth.uid) {
      return NextResponse.json({ hasPurchased: false });
    }

    // Check if user has any approved order containing this product
    const order = await prisma.order.findFirst({
      where: {
        userId: auth.uid,
        status: { in: ["pago", "entregue", "concluido"] },
        items: {
          some: {
            productId,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ hasPurchased: Boolean(order) });
  } catch (error) {
    console.error("Error checking user purchases:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar a compra." },
      { status: 500 },
    );
  }
}

// GET /api/user-purchases/list - Get list of products user has purchased
export async function GET_USER_PURCHASES(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productIds = searchParams.getAll("productIds");
    
    // Authenticate user
    const auth = await authenticateRequest(req);
    
    if (!auth.ok || !auth.uid) {
      return NextResponse.json({ purchasedProducts: [] });
    }

    // Get all purchased product IDs for this user
    const orders = await prisma.order.findMany({
      where: {
        userId: auth.uid,
        status: { in: ["pago", "entregue", "concluido"] },
      },
      select: {
        items: {
          select: {
            productId: true,
          },
        },
      },
    });

    // Extract all product IDs from orders
    const purchasedProductIds = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => {
        purchasedProductIds.add(item.productId);
      });
    });

    // If specific productIds were requested, return intersection
    if (productIds.length > 0) {
      const purchasedProducts = productIds.filter(id => purchasedProductIds.has(id));
      return NextResponse.json({ purchasedProducts });
    }

    // Return all purchased products
    return NextResponse.json({ purchasedProducts: Array.from(purchasedProductIds) });
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    return NextResponse.json({ purchasedProducts: [] });
  }
}