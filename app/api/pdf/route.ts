import { NextRequest, NextResponse } from "next/server";
import { renderCompanyReportPdf } from "@/lib/pdf-template";
import type { CompanyResearchResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as CompanyResearchResult;

    if (!data?.companyName || !data?.website) {
      return NextResponse.json(
        { error: "Missing research data to generate a PDF from." },
        { status: 400 }
      );
    }

    const buffer = await renderCompanyReportPdf(data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.companyName.replace(/\s+/g, "_")}_report.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }
}