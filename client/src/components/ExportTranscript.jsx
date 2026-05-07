import React, { useState } from 'react';
import { exportTranscript, exportTranscriptAnonymous } from '../services/api';
import './ExportTranscript.css';

/**
 * ExportTranscript
 *
 * Props:
 *   ticket        — the ticket object (must have _id and ticketId)
 *   anonymousToken — string if student is using it; null if counselor/admin
 *
 * Flow:
 *   1. User clicks "Export Encrypted Transcript"
 *   2. API returns the encrypted file as plain text + key in X-Encryption-Key header
 *   3. Component triggers a browser file download of the .enc.txt file
 *   4. Component shows the decryption key once, with a copy button
 *   5. User is warned the key will not be shown again
 */
export default function ExportTranscript({ ticket, anonymousToken }) {
  const [loading, setLoading]       = useState(false);
  const [exportKey, setExportKey]   = useState(null);   // shown after download
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');
  const [filename, setFilename]     = useState('');
  const [dismissed, setDismissed]   = useState(false);  // hide key panel

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setExportKey(null);
    setCopied(false);
    setDismissed(false);

    try {
      // Call the right endpoint depending on whether student or counselor
      const res = anonymousToken
        ? await exportTranscriptAnonymous(ticket._id, anonymousToken)
        : await exportTranscript(ticket._id);

      // Extract the encryption key from the response header
      const key  = res.headers['x-encryption-key'];
      const disp = res.headers['content-disposition'] || '';
      const nameMatch = disp.match(/filename="(.+?)"/);
      const fname = nameMatch ? nameMatch[1] : `ventify-transcript-${ticket.ticketId}.enc.txt`;

      // Trigger browser file download
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFilename(fname);
      setExportKey(key);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!exportKey) return;
    navigator.clipboard.writeText(exportKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="export-transcript">

      {/* Export button */}
      <button
        className="btn btn-secondary btn-sm export-btn"
        onClick={handleExport}
        disabled={loading}
        title="Download encrypted chat transcript"
      >
        {loading ? (
          <><span className="export-spinner" /> Encrypting...</>
        ) : (
          <>🔐 Export Encrypted Transcript</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* Key reveal panel — shown once after successful export */}
      {exportKey && !dismissed && (
        <div className="export-key-panel">
          <div className="export-key-header">
            <div className="export-key-icon">🔑</div>
            <div>
              <strong>Decryption Key — Save This Now</strong>
              <p>
                File <code className="export-filename">{filename}</code> downloaded.
                This key is generated fresh for every export and shown <em>only once</em>.
                It is never stored on the server.
              </p>
            </div>
          </div>

          {/* The actual key */}
          <div className="export-key-box">
            <code className="export-key-text">{exportKey}</code>
            <button
              className={`btn btn-sm copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* How to decrypt instructions */}
          <details className="export-how-to">
            <summary>How to decrypt this file</summary>
            <div className="export-how-to-body">
              <p>The file is encrypted with <strong>AES-256-CBC</strong>. To decrypt:</p>
              <p><strong>Option A — OpenSSL (command line):</strong></p>
              <pre>{`# Save the key above, then run:
openssl enc -d -aes-256-cbc -in transcript.enc.txt \\
  -out transcript.txt -K <your-key-hex> -iv <first-32-chars-of-file>`}</pre>
              <p><strong>Option B — Online tool:</strong></p>
              <p>
                Use any AES-256-CBC decryption tool. Provide the key in hex format.
                The first 32 characters of the file (base64 decoded) are the IV.
              </p>
              <p><strong>Option C — Ask your admin</strong> to decrypt it using the
              built-in decryption endpoint: <code>POST /api/transcripts/decrypt</code></p>
            </div>
          </details>

          <div className="export-key-warning">
            ⚠️ Once you close this panel, this key cannot be recovered.
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setDismissed(true)}
          >
            I have saved my key — close this panel
          </button>
        </div>
      )}

      {/* Dismissed confirmation */}
      {exportKey && dismissed && (
        <div className="export-done-notice">
          ✓ Transcript exported. Keep your decryption key safe.
        </div>
      )}
    </div>
  );
}