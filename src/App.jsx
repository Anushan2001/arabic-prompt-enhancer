import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an expert Arabic-to-English AI prompt enhancement assistant. Your job is to take an Arabic prompt and transform it into a powerful, well-structured English prompt that will get the best results from AI models.

Follow these steps precisely:

1. **Dialect Detection**: Identify whether the Arabic input is Modern Standard Arabic (MSA) or a specific dialect (Egyptian, Levantine, Gulf, Maghrebi, Iraqi, Sudanese, etc.)

2. **Meaning-Based Translation**: Translate the Arabic prompt into clear, natural English. Focus on preserving the user's TRUE INTENT and meaning — never translate literally. Capture implied context, cultural references, and nuances.

3. **Prompt Enhancement**: Transform the translated text into a well-engineered English prompt by:
   - Adding a clear role/persona for the AI (e.g., "You are an expert...")
   - Structuring the request with clear sections
   - Specifying the desired output format
   - Adding relevant constraints, edge cases, or clarifications
   - Including step-by-step instructions if the task is complex

4. **Back-Translation Summary**: Provide a brief Arabic summary of the enhanced prompt so the user can verify their intent was preserved.

IMPORTANT RULES:
- Always respond in valid JSON with this exact structure:
{
  "dialect": "MSA or dialect name",
  "literal_translation": "Direct English translation",
  "enhanced_prompt": "The full enhanced English prompt",
  "arabic_summary": "Arabic back-translation summary",
  "enhancement_notes": "Brief explanation of what was added/improved"
}
- Do NOT include markdown backticks or any text outside the JSON
- Make the enhanced prompt significantly better than a simple translation
- Preserve the user's original intent at all costs`;

const TONES = [
  { id: "general", label: "General", labelAr: "عام" },
  { id: "technical", label: "Technical", labelAr: "تقني" },
  { id: "creative", label: "Creative", labelAr: "إبداعي" },
  { id: "academic", label: "Academic", labelAr: "أكاديمي" },
  { id: "business", label: "Business", labelAr: "تجاري" },
];

const TARGETS = [
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
  { id: "general", label: "Any AI" },
];

const EXAMPLES = [
  "اكتب لي مقال عن الذكاء الاصطناعي في التعليم",
  "ساعدني أكتب إيميل رسمي لمديري عن تأخير المشروع",
  "اشرح لي كيف يعمل البلوكتشين بطريقة بسيطة",
  "أريد خطة تسويقية لمتجر إلكتروني جديد",
];

function Spinner() {
  return (
    <div style={{
      display: "inline-block",
      width: 20,
      height: 20,
      border: "2.5px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{
      background: copied ? "#059669" : "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#e2e8f0",
      padding: "6px 14px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [keySet, setKeySet] = useState(() => !!localStorage.getItem("anthropic_key"));
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("general");
  const [target, setTarget] = useState("claude");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("enhanced");
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const saveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("anthropic_key", apiKey.trim());
      setKeySet(true);
    }
  };

  const clearKey = () => {
    localStorage.removeItem("anthropic_key");
    setApiKey("");
    setKeySet(false);
  };

  const enhance = async () => {
    if (!input.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const toneLabel = TONES.find(t => t.id === tone)?.label || "General";
    const targetLabel = TARGETS.find(t => t.id === target)?.label || "Any AI";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Arabic prompt to enhance:\n\n${input}\n\nSettings:\n- Tone: ${toneLabel}\n- Target AI: ${targetLabel}\n\nAdapt the enhanced prompt style for the "${toneLabel}" tone and optimize it for "${targetLabel}". Respond ONLY with the JSON object, no markdown or extra text.`
          }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab("enhanced");
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("authentication")) {
        setError("Invalid API key. Please check and try again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "enhanced", label: "Enhanced Prompt" },
    { id: "translation", label: "Translation" },
    { id: "arabic", label: "ملخص عربي" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Noto+Kufi+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.15); }
          50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.3); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0c0f1a 0%, #111827 40%, #0f172a 100%)",
        color: "#e2e8f0",
        fontFamily: "'DM Sans', sans-serif",
        padding: "0 16px",
      }}>
        {/* Header */}
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          paddingTop: 48,
          paddingBottom: 24,
          textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 40,
            padding: "8px 20px",
            marginBottom: 20,
            fontSize: 13,
            color: "#a5b4fc",
            letterSpacing: 0.5,
          }}>
            <span style={{ fontSize: 16 }}>✦</span>
            Prompt Enhancement Engine
          </div>

          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            margin: "0 0 8px",
            background: "linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 50%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
          }}>
            Arabic → English
          </h1>
          <p style={{
            fontFamily: "'Noto Kufi Arabic', sans-serif",
            fontSize: 22,
            color: "#818cf8",
            margin: "0 0 12px",
            fontWeight: 500,
          }}>
            حوّل أفكارك العربية إلى برومبتات إنجليزية قوية
          </p>
          <p style={{
            color: "#64748b",
            fontSize: 14,
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Translate your Arabic prompts into optimized, well-structured English prompts that get better AI results.
          </p>
        </div>

        {/* API Key Section */}
        {!keySet ? (
          <div style={{
            maxWidth: 720,
            margin: "0 auto 20px",
            background: "rgba(30,41,59,0.5)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 16,
            padding: 24,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#fbbf24" }}>
              🔑 API Key Required
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Enter your Anthropic API key to power the enhancer. Your key is stored locally in your browser only — it never leaves your device except to call the API directly.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: 10,
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                }}
                onKeyDown={e => e.key === "Enter" && saveKey()}
              />
              <button onClick={() => setShowKey(!showKey)} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#94a3b8",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
              }}>
                {showKey ? "Hide" : "Show"}
              </button>
              <button onClick={saveKey} style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}>
                Save
              </button>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
              Get your key at{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                style={{ color: "#818cf8", textDecoration: "none" }}>
                console.anthropic.com/settings/keys
              </a>
            </p>
          </div>
        ) : (
          <div style={{
            maxWidth: 720,
            margin: "0 auto 20px",
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <button onClick={clearKey} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#64748b",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12,
            }}>
              🔑 Change API Key
            </button>
          </div>
        )}

        {/* Main Card */}
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "linear-gradient(180deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.8) 100%)",
          border: "1px solid rgba(99,102,241,0.12)",
          borderRadius: 20,
          padding: 28,
          animation: "pulseGlow 4s ease-in-out infinite",
        }}>
          {/* Textarea */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 13,
              color: "#94a3b8",
              marginBottom: 8,
              fontWeight: 500,
            }}>
              Your Arabic Prompt — البرومبت بالعربي
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اكتب البرومبت هنا..."
              dir="rtl"
              style={{
                width: "100%",
                minHeight: 120,
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 14,
                padding: 16,
                color: "#e2e8f0",
                fontSize: 16,
                fontFamily: "'Noto Kufi Arabic', sans-serif",
                lineHeight: 1.8,
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.15)"}
            />
          </div>

          {/* Example chips */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Try an example:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => setInput(ex)} style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  color: "#a5b4fc",
                  padding: "6px 14px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Noto Kufi Arabic', sans-serif",
                  direction: "rtl",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  e.target.style.background = "rgba(99,102,241,0.15)";
                  e.target.style.borderColor = "rgba(99,102,241,0.3)";
                }}
                onMouseLeave={e => {
                  e.target.style.background = "rgba(99,102,241,0.06)";
                  e.target.style.borderColor = "rgba(99,102,241,0.12)";
                }}>
                  {ex.length > 40 ? ex.slice(0, 40) + "..." : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Row */}
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                Tone / النبرة
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: tone === t.id ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.08)",
                    background: tone === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                    color: tone === t.id ? "#a5b4fc" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                Target AI / الهدف
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TARGETS.map(t => (
                  <button key={t.id} onClick={() => setTarget(t.id)} style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: target === t.id ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.08)",
                    background: target === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                    color: target === t.id ? "#a5b4fc" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={enhance} disabled={loading || !input.trim() || !keySet} style={{
            width: "100%",
            padding: "14px 24px",
            background: loading
              ? "linear-gradient(90deg, #4338ca, #6366f1, #4338ca)"
              : (!input.trim() || !keySet)
                ? "rgba(99,102,241,0.2)"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            backgroundSize: loading ? "200% 100%" : "100% 100%",
            animation: loading ? "shimmer 1.5s linear infinite" : "none",
            border: "none",
            borderRadius: 14,
            color: (!input.trim() || !keySet) ? "#64748b" : "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading || !input.trim() || !keySet ? "default" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 0.3s",
          }}>
            {loading ? <><Spinner /> Enhancing your prompt...</> : "Enhance Prompt ✦ تحسين البرومبت"}
          </button>

          {error && (
            <div style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 14,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultRef} style={{
            maxWidth: 720,
            margin: "24px auto 48px",
            animation: "fadeUp 0.5s ease-out",
          }}>
            {/* Dialect Badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}>
              <span style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#6ee7b7",
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
              }}>
                Detected: {result.dialect}
              </span>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: 4,
              marginBottom: 2,
              background: "rgba(15,23,42,0.6)",
              borderRadius: "14px 14px 0 0",
              padding: "6px 6px 0",
              borderTop: "1px solid rgba(99,102,241,0.12)",
              borderLeft: "1px solid rgba(99,102,241,0.12)",
              borderRight: "1px solid rgba(99,102,241,0.12)",
            }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1,
                  padding: "10px 8px",
                  background: activeTab === tab.id ? "rgba(30,41,59,0.8)" : "transparent",
                  border: "none",
                  borderRadius: "10px 10px 0 0",
                  color: activeTab === tab.id ? "#e2e8f0" : "#64748b",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: tab.id === "arabic" ? "'Noto Kufi Arabic', sans-serif" : "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  borderBottom: activeTab === tab.id ? "2px solid #818cf8" : "2px solid transparent",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{
              background: "rgba(30,41,59,0.6)",
              border: "1px solid rgba(99,102,241,0.12)",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
              padding: 24,
            }}>
              {activeTab === "enhanced" && (
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>Ready to use — copy and paste into your AI</span>
                    <CopyButton text={result.enhanced_prompt} />
                  </div>
                  <div style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(99,102,241,0.1)",
                    borderRadius: 12,
                    padding: 20,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: "#cbd5e1",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {result.enhanced_prompt}
                  </div>
                </div>
              )}

              {activeTab === "translation" && (
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>Direct meaning-based translation</span>
                    <CopyButton text={result.literal_translation} />
                  </div>
                  <div style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(99,102,241,0.1)",
                    borderRadius: 12,
                    padding: 20,
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "#cbd5e1",
                  }}>
                    {result.literal_translation}
                  </div>
                </div>
              )}

              {activeTab === "arabic" && (
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>تأكد أن المعنى محفوظ</span>
                    <CopyButton text={result.arabic_summary} />
                  </div>
                  <div dir="rtl" style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(99,102,241,0.1)",
                    borderRadius: 12,
                    padding: 20,
                    fontSize: 16,
                    lineHeight: 2,
                    color: "#cbd5e1",
                    fontFamily: "'Noto Kufi Arabic', sans-serif",
                  }}>
                    {result.arabic_summary}
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "#94a3b8",
                }}>
                  <p style={{ margin: "0 0 8px", color: "#a5b4fc", fontWeight: 600, fontSize: 13 }}>
                    What was enhanced:
                  </p>
                  {result.enhancement_notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 0 40px",
          textAlign: "center",
          fontSize: 12,
          color: "#475569",
        }}>
          Powered by Claude · Meaning-based translation, not literal
        </div>
      </div>
    </>
  );
}
