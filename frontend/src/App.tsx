import { useState } from "react";
import { Globe, Sparkles, AlertCircle, Copy, Check, Loader2 } from "lucide-react";
import "./App.css"; // Make sure to import the CSS file here

export default function App() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const res = await fetch("http://localhost:8000/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Failed to process the URL. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setUrl("");
    setSummary("");
    setError("");
  };

  return (
    <div className="app-container">
      {/* Decorative background elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="main-wrapper">
        <div className="content-container">
          {/* Header */}
          <div className="header">
            <div className="icon-box">
              <Sparkles />
            </div>
            <h1 className="title">
              AI Web Scraper
            </h1>
            <p className="subtitle">
              Extract and summarize content from any webpage instantly
            </p>
          </div>

          {/* Main Card */}
          <div className="glass-card">
            <div className="card-padding">
              <form onSubmit={handleSubmit} className="form-group">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Globe />
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="url-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ marginTop: '1rem' }} className="button-group">
                  <button
                    type="submit"
                    disabled={loading || !url}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="spin" size={20} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Analyze</span>
                      </>
                    )}
                  </button>

                  {(summary || error) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn btn-secondary"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>

              {/* Error Message */}
              {error && (
                <div className="error-box">
                  <div className="error-content">
                    <AlertCircle size={20} />
                    <div>
                      <h3 className="error-title">Error</h3>
                      <p className="error-msg">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Result */}
              {summary && (
                <div className="summary-wrapper">
                  <div className="summary-card">
                    <div className="summary-header">
                      <h2 className="summary-title">
                        <Sparkles size={20} style={{ color: 'var(--primary-blue)' }} />
                        Summary
                      </h2>
                      <button
                        onClick={handleCopy}
                        className="btn-copy"
                      >
                        {copied ? (
                          <>
                            <Check size={16} className="text-green" />
                            <span className="text-green">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="summary-content">
                      <p className="summary-text">
                        {summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Powered by AI • Secure & Fast</p>
          </div>
        </div>
      </div>
    </div>
  );
}