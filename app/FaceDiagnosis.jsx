"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0e0e0e; }

  .app {
    min-height: 100vh;
    background: #0e0e0e;
    font-family: 'DM Mono', monospace;
    color: #f0ece4;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header {
    width: 100%;
    padding: 24px 28px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .header-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #f0ece4;
  }

  .camera-wrap {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3/4;
    background: #111;
    overflow: hidden;
  }

  .camera-wrap video {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .camera-wrap img.captured {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .face-guide {
    position: absolute; inset: 0;
    pointer-events: none;
    display: flex; align-items: center; justify-content: center;
  }
  .face-guide svg { width: 55%; height: 70%; opacity: 0.3; }

  .corner {
    position: absolute; width: 20px; height: 20px;
    border-color: rgba(255,255,255,0.55); border-style: solid;
  }
  .corner.tl { top:14px; left:14px; border-width: 2px 0 0 2px; }
  .corner.tr { top:14px; right:14px; border-width: 2px 2px 0 0; }
  .corner.bl { bottom:14px; left:14px; border-width: 0 0 2px 2px; }
  .corner.br { bottom:14px; right:14px; border-width: 0 2px 2px 0; }

  .flash {
    position: absolute; inset: 0;
    background: white; opacity: 0;
    pointer-events: none; transition: opacity 0s;
  }
  .flash.go { opacity: 1; transition: opacity 0.07s; }
  .flash.fade { opacity: 0; transition: opacity 0.45s; }

  .camera-err {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; color: rgba(255,255,255,0.35);
    font-size: 0.68rem; letter-spacing: 0.08em;
    text-align: center; padding: 24px;
  }
  .camera-err span:first-child { font-size: 2.2rem; opacity: 0.25; }

  .loading-overlay {
    position: absolute; inset: 0;
    background: rgba(14,14,14,0.78);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; z-index: 10;
  }

  .spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: #C4472A;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-text {
    font-size: 0.62rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(255,255,255,0.35);
  }

  canvas { display: none; }

  .controls {
    width: 100%; max-width: 480px;
    padding: 18px 22px 8px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .shutter-row {
    display: flex; align-items: center;
    justify-content: center; padding: 10px 0;
  }

  .shutter-btn {
    width: 70px; height: 70px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.65);
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .shutter-btn::after {
    content: ''; width: 54px; height: 54px;
    border-radius: 50%; background: white; transition: all 0.12s;
  }
  .shutter-btn:hover::after { transform: scale(0.93); background: #f0ece4; }
  .shutter-btn:active::after { transform: scale(0.86); }
  .shutter-btn:disabled { opacity: 0.25; cursor: not-allowed; }

  .hint {
    font-size: 0.58rem; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.28);
    text-align: center; line-height: 1.7;
  }

  .diagnose-btn {
    background: #C4472A; border: none; color: white;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.14em;
    text-transform: uppercase; padding: 15px;
    cursor: pointer; transition: background 0.15s; width: 100%;
  }
  .diagnose-btn:hover:not(:disabled) { background: #a83825; }
  .diagnose-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .retake-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.5);
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.12em;
    text-transform: uppercase; padding: 11px;
    cursor: pointer; transition: all 0.12s;
  }
  .retake-btn:hover { border-color: rgba(255,255,255,0.4); color: white; }

  .result-panel {
    width: 100%; max-width: 480px;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 26px 22px 52px;
    animation: slideUp 0.5s ease;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .section-label {
    font-size: 0.52rem; letter-spacing: 0.25em;
    text-transform: uppercase; color: rgba(255,255,255,0.28);
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-label::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.08);
  }

  .face-type {
    font-family: 'Playfair Display', serif;
    font-size: 2.3rem; font-weight: 700;
    letter-spacing: -0.02em;
    color: #C4472A; margin-bottom: 4px;
  }

  .face-type-en {
    font-family: 'Playfair Display', serif;
    font-size: 0.82rem; font-style: italic;
    color: #B8860B; margin-bottom: 16px;
  }

  .impression-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }

  .tag {
    font-size: 0.57rem; letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid rgba(255,255,255,0.18);
    padding: 4px 10px; color: rgba(255,255,255,0.55);
  }

  .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 16px 0; }

  .scores-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }

  .score-item label {
    font-size: 0.52rem; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(255,255,255,0.32);
    display: block; margin-bottom: 5px;
  }
  .score-bar-track { height: 2px; background: rgba(255,255,255,0.09); }
  .score-bar-fill { height: 100%; background: #C4472A; transition: width 0.9s cubic-bezier(0.25,0,0,1); }
  .score-num { font-size: 0.95rem; font-weight: 500; margin-top: 5px; color: #f0ece4; }

  .description-text {
    font-size: 0.76rem; line-height: 1.9;
    color: rgba(255,255,255,0.6); margin-bottom: 16px;
  }

  .advice-block {
    background: rgba(255,255,255,0.035);
    border-left: 2px solid #B8860B;
    padding: 14px 16px;
    font-size: 0.73rem; line-height: 1.8;
    color: rgba(255,255,255,0.55);
  }
  .advice-label {
    font-size: 0.48rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: #B8860B; margin-bottom: 6px;
  }

  .discord-badge {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.62rem; letter-spacing: 0.07em;
    padding: 10px 13px; margin-top: 16px;
    animation: slideUp 0.3s ease;
  }
  .discord-badge.ok  { background: rgba(88,101,242,0.1); color: #7289da; border-left: 2px solid #7289da; }
  .discord-badge.err { background: rgba(196,71,42,0.1); color: #C4472A; border-left: 2px solid #C4472A; }
  .discord-badge.sending { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.3); border-left: 2px solid rgba(255,255,255,0.15); }
`;

const DiscordIcon = () => (
  <svg width="13" height="10" viewBox="0 0 71 55" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.9a40.3 40.3 0 0 0-1.8 3.7 54 54 0 0 0-16.3 0A40.3 40.3 0 0 0 25.6.9 58.4 58.4 0 0 0 11 4.9C1.6 18.7-1 32.2.3 45.5a58.9 58.9 0 0 0 18 9.1 44.3 44.3 0 0 0 3.8-6.3 38.3 38.3 0 0 1-6-2.9l1.4-1.1a42 42 0 0 0 36 0l1.5 1.1a38.4 38.4 0 0 1-6 2.9 44.2 44.2 0 0 0 3.8 6.3 58.7 58.7 0 0 0 18-9.1C72.2 30 68.8 16.6 60.1 4.9zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 3.9-2.8 7.2-6.3 7.2zm23.7 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 3.9-2.8 7.2-6.3 7.2z"/>
  </svg>
);

export default function FaceDiagnosis() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const flashRef = useRef();
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraErr, setCameraErr] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [discordStatus, setDiscordStatus] = useState(null);
  const [discordMsg, setDiscordMsg] = useState("");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setCameraReady(true); };
      }
    }).catch(() => { if (active) setCameraErr(true); });
    return () => { active = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleShutter = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;
    const fl = flashRef.current;
    if (fl) {
      fl.classList.remove("fade"); fl.classList.add("go");
      setTimeout(() => { fl.classList.remove("go"); fl.classList.add("fade"); }, 80);
      setTimeout(() => fl.classList.remove("fade"), 520);
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImg(dataUrl);
    setImageBase64({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    setResult(null); setDiscordStatus(null);
  }, [cameraReady]);

  const handleRetake = () => {
    setCapturedImg(null); setImageBase64(null);
    setResult(null); setDiscordStatus(null);
  };

  const handleDiagnose = async () => {
    if (!imageBase64) return;
    setLoading(true); setResult(null); setDiscordStatus(null);
    try {
      // → サーバー側APIルート経由（APIキーはサーバーで管理）
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageBase64)
      });
      const parsed = await res.json();
      setResult(parsed);

      // Discord送信もサーバー経由
      setDiscordStatus("sending"); setDiscordMsg("Discordに送信中...");
      const dRes = await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const dData = await dRes.json();
      setDiscordStatus(dData.ok ? "ok" : "err");
      setDiscordMsg(dData.ok ? "✓ Discordに送信しました" : "送信失敗。");
    } catch {
      setResult({ error: "診断に失敗しました。もう一度お試しください。" });
    }
    setLoading(false);
  };

  const ScoreBar = ({ label, value }) => (
    <div className="score-item">
      <label>{label}</label>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="score-num">{value}</div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="app">
        <header className="header">
          <div className="header-title">顔診断</div>
        </header>

        <div className="camera-wrap">
          {!capturedImg && <video ref={videoRef} playsInline muted />}
          {capturedImg && <img className="captured" src={capturedImg} alt="captured" />}
          {!capturedImg && cameraReady && (
            <div className="face-guide">
              <svg viewBox="0 0 100 130" fill="none">
                <ellipse cx="50" cy="65" rx="38" ry="54" stroke="white" strokeWidth="1.5" strokeDasharray="4 3"/>
              </svg>
            </div>
          )}
          {!capturedImg && cameraReady && (
            <>
              <div className="corner tl"/><div className="corner tr"/>
              <div className="corner bl"/><div className="corner br"/>
            </>
          )}
          <div ref={flashRef} className="flash" />
          {cameraErr && (
            <div className="camera-err">
              <span>📷</span>
              <span>カメラへのアクセスが<br/>許可されていません</span>
            </div>
          )}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">Analysing...</div>
            </div>
          )}
          <canvas ref={canvasRef} />
        </div>

        <div className="controls">
          {!capturedImg ? (
            <>
              <div className="shutter-row">
                <button className="shutter-btn" onClick={handleShutter} disabled={!cameraReady || cameraErr} />
              </div>
              <div className="hint">顔を枠に合わせてシャッターを押してください</div>
            </>
          ) : (
            <>
              <button className="diagnose-btn" onClick={handleDiagnose} disabled={loading}>
                {loading ? "診断中..." : "▶ この写真で診断する"}
              </button>
              <button className="retake-btn" onClick={handleRetake}>↩ 撮り直す</button>
            </>
          )}
        </div>

        {!loading && result && !result.error && (
          <div className="result-panel">
            <div className="section-label">Diagnosis Result</div>
            <div className="face-type">{result.faceType}</div>
            <div className="face-type-en">{result.faceTypeEn}</div>
            <div className="impression-tags">
              {result.impressions?.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
            </div>
            <div className="divider" />
            <div className="scores-grid">
              <ScoreBar label="対称性"     value={result.scores?.symmetry   ?? 0} />
              <ScoreBar label="柔らかさ"   value={result.scores?.softness   ?? 0} />
              <ScoreBar label="シャープさ" value={result.scores?.sharpness  ?? 0} />
              <ScoreBar label="個性"       value={result.scores?.uniqueness ?? 0} />
            </div>
            <div className="divider" />
            <div className="description-text">{result.description}</div>
            <div className="advice-block">
              <div className="advice-label">Styling Advice</div>
              {result.advice}
            </div>
            {discordStatus && (
              <div className={`discord-badge ${discordStatus}`}>
                <DiscordIcon />{discordMsg}
              </div>
            )}
          </div>
        )}
        {!loading && result?.error && (
          <div className="controls">
            <div className="discord-badge err">{result.error}</div>
          </div>
        )}
      </div>
    </>
  );
}
