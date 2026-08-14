import { NextResponse } from "next/server";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { getOrCreateCart } from "@/lib/cart";

export async function POST(request: Request) {
  let body: { variantId?: string; quantity?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const variantId = body.variantId;
  const quantity = Number(body.quantity ?? 1);

  if (!variantId) {
    return NextResponse.json({ ok: false, error: "variantId is required." }, { status: 400 });
  }

  if (quantity < 1) {
    return NextResponse.json({ ok: false, error: "quantity must be at least 1." }, { status: 400 });
  }

  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();
  const result = commerce.cart.addLine(ctx, cart.id, variantId, quantity);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 400 });
  }

  const lineCount = result.data.lines.reduce((sum, line) => sum + line.quantity, 0);

  return NextResponse.json({
    ok: true,
    cartId: result.data.id,
    lineCount,
    cart: result.data,
  });
}
