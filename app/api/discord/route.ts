import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const botToken = form.get("botToken") as string;
    const channelId = form.get("channelId") as string;
    const applicantName = form.get("applicantName") as string;
    const applicantEmail = form.get("applicantEmail") as string;
    const companyName = form.get("companyName") as string;
    const companyWebsite = form.get("companyWebsite") as string;
    const pdf = form.get("pdf") as File;

    const discordForm = new FormData();

    discordForm.append(
      "payload_json",
      JSON.stringify({
        content: `
📄 **AI Company Research Report**

👤 Applicant: ${applicantName}
📧 Email: ${applicantEmail}

🏢 Company: ${companyName}
🌐 Website: ${companyWebsite}
        `,
      })
    );

    discordForm.append("files[0]", pdf);

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        body: discordForm,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Discord upload failed" },
      { status: 500 }
    );
  }
}