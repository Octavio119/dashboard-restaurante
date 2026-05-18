import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey || !apiKey.startsWith("sk_latam_")) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing API Key." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { customer, items, currency } = body;

    // Basic validation
    if (!customer || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customer or items." },
        { status: 400 }
      );
    }

    // Simulate Processing Time (Tax Authority Handshake)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calculate totals
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
    const taxTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price * (item.tax_rate || 0.16)), 0);
    const total = subtotal + taxTotal;

    const invoiceUuid = uuidv4();
    const folio = `F-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      status: "success",
      message: "Invoice generated and signed successfully.",
      data: {
        uuid: invoiceUuid,
        folio: folio,
        customer_name: customer.name,
        total: total,
        currency: currency || "MXN",
        stamp_date: new Date().toISOString(),
        pdf_url: `https://api.lataminvoice.com/v1/view/${invoiceUuid}.pdf`,
        xml_url: `https://api.lataminvoice.com/v1/view/${invoiceUuid}.xml`,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
