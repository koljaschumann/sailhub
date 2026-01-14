import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface DamageReportPayload {
  reporterName: string;
  reporterEmail: string;
  equipmentName: string;
  equipmentType: string;
  description: string;
  reportId: string;
  createdAt: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload: DamageReportPayload = await req.json();

    const { reporterName, reporterEmail, equipmentName, equipmentType, description, reportId, createdAt } = payload;

    // Format date for German locale
    const formattedDate = new Date(createdAt).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0c1929 0%, #1a365d 100%); color: #f5f0e6; padding: 30px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
    .detail { margin-bottom: 15px; }
    .detail-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .detail-value { font-size: 16px; margin-top: 4px; }
    .description-box { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-top: 20px; }
    .footer { background: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #64748b; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Schadensmeldung eingegangen</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">TSC Jugendabteilung - SailHub</p>
    </div>
    <div class="content">
      <p>Hallo ${reporterName},</p>
      <p>vielen Dank für deine Schadensmeldung! Wir haben sie erfolgreich erhalten und werden uns darum kümmern.</p>

      <div style="margin-top: 25px;">
        <div class="detail">
          <div class="detail-label">Meldungs-ID</div>
          <div class="detail-value"><code>${reportId.slice(0, 8)}</code></div>
        </div>
        <div class="detail">
          <div class="detail-label">Eingereicht am</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail">
          <div class="detail-label">Equipment</div>
          <div class="detail-value">${equipmentName} <span class="badge">${equipmentType}</span></div>
        </div>
      </div>

      <div class="description-box">
        <div class="detail-label">Schadensbeschreibung</div>
        <div class="detail-value" style="white-space: pre-wrap;">${description}</div>
      </div>

      <p style="margin-top: 25px;">Du kannst den Status deiner Meldung jederzeit unter <a href="https://sailhub.aitema.de/schadensmeldung">sailhub.aitema.de/schadensmeldung</a> einsehen.</p>
    </div>
    <div class="footer">
      <p>Tegeler Segel-Club e.V. - Jugendabteilung</p>
      <p style="margin: 5px 0 0 0;">Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SailHub <noreply@sailhub.aitema.de>",
        to: [reporterEmail],
        subject: `Schadensmeldung eingegangen - ${equipmentName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
