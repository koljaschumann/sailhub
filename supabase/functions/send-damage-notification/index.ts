import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface DamageNotificationPayload {
  recipients: string[];
  equipmentName: string;
  equipmentType: string;
  description: string;
  reporterName: string;
  reportId: string;
  createdAt?: string;
  photoCount?: number;
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

    const payload: DamageNotificationPayload = await req.json();

    const {
      recipients,
      equipmentName,
      equipmentType,
      description,
      reporterName,
      reportId,
      createdAt,
      photoCount = 0
    } = payload;

    // Validate recipients
    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients specified");
    }

    // Format date for German locale
    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    // Get severity indicator based on description length/keywords
    const urgentKeywords = ["dringend", "sofort", "notfall", "gefährlich", "sicherheit", "leck", "loch"];
    const isUrgent = urgentKeywords.some(keyword =>
      description.toLowerCase().includes(keyword)
    );

    // Build HTML email for staff notification
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isUrgent ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; color: white; padding: 30px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
    .detail { margin-bottom: 15px; }
    .detail-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .detail-value { font-size: 16px; margin-top: 4px; }
    .description-box { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-top: 20px; }
    .footer { background: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #64748b; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .urgent-badge { background: #fecaca; color: #dc2626; }
    .action-btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isUrgent ? '⚠️ DRINGENDE ' : ''}Neue Schadensmeldung</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">TSC Jugendabteilung - Benachrichtigung für Warte</p>
    </div>
    <div class="content">
      <p>Eine neue Schadensmeldung wurde eingereicht und erfordert eure Aufmerksamkeit.</p>

      <div class="info-grid">
        <div class="detail">
          <div class="detail-label">Equipment</div>
          <div class="detail-value">${equipmentName}</div>
        </div>
        <div class="detail">
          <div class="detail-label">Typ</div>
          <div class="detail-value"><span class="badge">${equipmentType}</span></div>
        </div>
        <div class="detail">
          <div class="detail-label">Gemeldet von</div>
          <div class="detail-value">${reporterName}</div>
        </div>
        <div class="detail">
          <div class="detail-label">Zeitpunkt</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
      </div>

      <div class="description-box">
        <div class="detail-label">Schadensbeschreibung</div>
        <div class="detail-value" style="white-space: pre-wrap;">${description}</div>
      </div>

      ${photoCount > 0 ? `
      <div class="detail" style="margin-top: 15px;">
        <div class="detail-label">Anhänge</div>
        <div class="detail-value">📷 ${photoCount} Foto${photoCount > 1 ? 's' : ''} beigefügt</div>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://sailhub.aitema.de/schadensmeldung" class="action-btn">
          Zur Schadensmeldung →
        </a>
      </div>

      <p style="margin-top: 25px; font-size: 14px; color: #6b7280;">
        Meldungs-ID: <code>${reportId.slice(0, 8)}</code>
      </p>
    </div>
    <div class="footer">
      <p>Tegeler Segel-Club e.V. - Jugendabteilung</p>
      <p style="margin: 5px 0 0 0;">Diese Benachrichtigung wurde automatisch an Sportwart und Hängerwart gesendet.</p>
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
        to: recipients,
        subject: `${isUrgent ? '⚠️ DRINGEND: ' : ''}Neue Schadensmeldung - ${equipmentName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    console.log(`Notification sent to ${recipients.length} recipient(s):`, recipients);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        recipientCount: recipients.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
