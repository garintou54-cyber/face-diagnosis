const WEBHOOK_URL = "https://discord.com/api/webhooks/1485371785510785126/YyNo0_jO7WIwyz6Ar3dAhuV-nLMlb5UuaPtm-CbZ0SDYsf-TK1pJ7u065j6iK56Q-pFm";

export async function POST(req) {
  const diagResult = await req.json();

  const embed = {
    title: `🔮 顔診断結果：${diagResult.faceType}`,
    description: diagResult.description,
    color: 0xC4472A,
    fields: [
      { name: "印象", value: diagResult.impressions?.join(" / ") ?? "—", inline: false },
      { name: "対称性",    value: `${diagResult.scores?.symmetry   ?? 0}/100`, inline: true },
      { name: "柔らかさ",  value: `${diagResult.scores?.softness   ?? 0}/100`, inline: true },
      { name: "シャープさ", value: `${diagResult.scores?.sharpness  ?? 0}/100`, inline: true },
      { name: "個性",      value: `${diagResult.scores?.uniqueness ?? 0}/100`, inline: true },
      { name: "アドバイス", value: diagResult.advice, inline: false },
    ],
    footer: { text: "Face Diagnosis App • 自動送信" }
  };

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  return Response.json({ ok: res.ok || res.status === 204 });
}
