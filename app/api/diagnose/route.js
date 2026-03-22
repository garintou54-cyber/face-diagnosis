export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType } = body;

    // =========================
    // 🔥 Anthropic API
    // =========================
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,

        system: `あなたはプロの顔診断師です。
必ずJSONのみ返してください。説明文禁止。

{
  "faceType": "",
  "faceTypeEn": "",
  "impressions": [],
  "scores": {
    "symmetry": 0,
    "softness": 0,
    "sharpness": 0,
    "uniqueness": 0
  },
  "description": "",
  "advice": ""
}`,

        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: "この顔を診断してください。",
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();

    // =========================
    // 🚨 HTTPエラーチェック
    // =========================
    if (!res.ok) {
      return Response.json(
        {
          error: "Anthropic API error",
          detail: data,
        },
        { status: 500 }
      );
    }

    // =========================
    // 🚨 Anthropic内部エラー対策
    // =========================
    if (data?.error) {
      return Response.json(
        {
          error: "Anthropic returned error",
          detail: data,
        },
        { status: 500 }
      );
    }

    // =========================
    // 🚨 contentチェック
    // =========================
    const text = data?.content?.[0]?.text;

    if (!text) {
      return Response.json(
        {
          error: "Invalid Anthropic response (no content)",
          raw: data,
        },
        { status: 500 }
      );
    }

    // =========================
    // 🚨 JSON parse安全化
    // =========================
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return Response.json(
        {
          error: "JSON parse failed",
          raw: text,
        },
        { status: 500 }
      );
    }

    // =========================
    // 🔥 Discord送信（安全版）
    // =========================
    try {
      await fetch("https://discord.com/api/webhooks/YOUR_WEBHOOK_URL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📊 顔診断結果
顔型: ${parsed.faceType || ""}
印象: ${parsed.impressions?.join(", ") || ""}
説明: ${parsed.description || ""}
アドバイス: ${parsed.advice || ""}`,
        }),
      });
    } catch (e) {
      console.log("Discord送信失敗", e);
    }

    // =========================
    // ✅ 正常返却
    // =========================
    return Response.json(parsed);
  } catch (e) {
    return Response.json(
      {
        error: e.message,
      },
      { status: 500 }
    );
  }
}
