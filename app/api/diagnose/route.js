export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType } = body;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: `あなたはプロの顔診断師です。アップロードされた顔写真を分析し、必ず以下のJSON形式のみで回答してください。前後に説明文やMarkdownは一切不要です。
{"faceType":"顔型（丸型・卵型・面長・ベース型・逆三角形型など）","faceTypeEn":"face type in English","impressions":["印象タグ1","印象タグ2","印象タグ3","印象タグ4"],"scores":{"symmetry":0,"softness":0,"sharpness":0,"uniqueness":0},"description":"顔の特徴の詳細な説明（3〜4文）","advice":"その顔型に合うメイク・ヘアスタイル・ファッションのアドバイス（2〜3文）"}`,
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
              { type: "text", text: "この顔を診断してください。" },
            ],
          },
        ],
      }),
    });

    const data = await res.json();

    if (!data.content || !Array.isArray(data.content)) {
      return Response.json(
        { error: "Anthropic API failed", detail: data },
        { status: 500 }
      );
    }

    const text = data.content.map((i) => i.text || "").join("");

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (e) {
      return Response.json(
        { error: "JSON parse failed", raw: text },
        { status: 500 }
      );
    }

    // 🔥 Discord送信（ここ追加）
    try {
      await fetch("https://discord.com/api/webhooks/1485371785510785126/YyNo0_jO7WIwyz6Ar3dAhuV-nLMlb5UuaPtm-CbZ0SDYsf-TK1pJ7u065j6iK56Q-pFm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📊 顔診断結果

顔型: ${parsed.faceType}
印象: ${parsed.impressions.join(", ")}

説明:
${parsed.description}

アドバイス:
${parsed.advice}`
        }),
      });
    } catch (e) {
      console.log("Discord送信失敗", e);
    }

    return Response.json(parsed);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
