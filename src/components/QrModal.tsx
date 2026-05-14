import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { decodeMatchPayload } from '../lib/share';
import type { Match } from '../types';

// ─── QrModal: display a QR code for a URL or offline payload ─────────────────

interface QrModalProps {
  data: string;
  title?: string;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  data,
  title = 'scan to view',
  onClose,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [pngUrl, setPngUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    QRCode.toString(data, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1A1A1A', light: '#FBFAF2' },
    }).then(svg => {
      if (!cancelled) setSvgContent(svg);
    }).catch(() => {});

    QRCode.toDataURL(data, {
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1A1A1A', light: '#FBFAF2' },
      width: 512,
    }).then(url => {
      if (!cancelled) setPngUrl(url);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [data]);

  // ESC closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data);
      toast.success('link copied');
    } catch {
      toast.error('copy failed');
    }
  };

  const handleDownloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'squad-match-qr.png';
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#FBFAF2',
          border: '1.5px solid #1A1A1A',
          padding: '1.5rem',
          transform: 'rotate(0.5deg)',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.12)',
          maxWidth: 340,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#1A1A1A',
            textTransform: 'lowercase',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          {title}
        </div>

        {/* QR SVG */}
        {svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              width: '100%',
              maxWidth: 260,
              margin: '0 auto',
              display: 'block',
              filter: 'url(#marker)',
            }}
          />
        ) : (
          <div style={{ width: 260, height: 260, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.9rem', color: '#6B6B63' }}>generating…</span>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <button
            onClick={handleCopyLink}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '0.9rem',
              color: '#1A1A1A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              opacity: 0.7,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            copy link
          </button>
          <button
            onClick={handleDownloadPng}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '0.9rem',
              color: '#1A1A1A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              opacity: 0.7,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            download png
          </button>
        </div>

        {/* Close hint */}
        <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.72rem', color: '#6B6B63', fontStyle: 'italic' }}>
            click outside to close
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── ScanQrModal: camera-based QR scanner with paste fallback ────────────────

interface ScanQrModalProps {
  onClose: () => void;
  onImportMatch?: (match: Match) => void;
}

declare class BarcodeDetector {
  constructor(options: { formats: string[] });
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({ onClose, onImportMatch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  const [hasBarcodeDetector] = useState(() => 'BarcodeDetector' in window);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleDetected = useCallback((raw: string) => {
    // URL with ?match=…
    if (raw.includes('?match=')) {
      onClose();
      window.location.assign(raw);
      return;
    }
    // Try base64 offline payload
    const match = decodeMatchPayload(raw);
    if (match) {
      onImportMatch?.(match);
      toast.success('imported match');
      onClose();
      return;
    }
    toast.error('unrecognised qr');
  }, [onClose, onImportMatch]);

  useEffect(() => {
    if (!hasBarcodeDetector) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
        setScanning(true);

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || !detectorRef.current) return;
          try {
            const results = await detectorRef.current.detect(videoRef.current);
            if (results.length > 0) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              handleDetected(results[0].rawValue);
            }
          } catch {
            // video not ready yet — ignore
          }
        }, 250);
      } catch {
        if (!cancelled) {
          setCameraError('camera access denied');
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [hasBarcodeDetector, handleDetected]);

  // ESC closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  const handlePasteSubmit = () => {
    const val = pasteValue.trim();
    if (!val) return;
    handleDetected(val);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: '#FBFAF2',
            border: '1.5px solid #1A1A1A',
            padding: '1.5rem',
            transform: 'rotate(-0.5deg)',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.12)',
            maxWidth: 380,
            width: '100%',
          }}
        >
          <div
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#1A1A1A',
              textTransform: 'lowercase',
              marginBottom: '1rem',
            }}
          >
            scan a qr
          </div>

          {hasBarcodeDetector && !cameraError && (
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%',
                  height: 240,
                  objectFit: 'cover',
                  border: '1.5px solid #D8D9D0',
                  display: 'block',
                  backgroundColor: '#1A1A1A',
                }}
              />
              {scanning && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: "'Caveat', cursive",
                    fontSize: '0.8rem',
                    color: '#FBFAF2',
                    opacity: 0.8,
                  }}
                >
                  hold qr up to camera
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '0.85rem', color: '#DC2626', marginBottom: '0.75rem' }}>
              {cameraError}
            </p>
          )}

          {/* Paste fallback — always shown */}
          <div>
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '0.85rem',
                color: '#6B6B63',
                marginBottom: '0.4rem',
              }}
            >
              {hasBarcodeDetector && !cameraError ? 'or paste a link / payload:' : 'paste a link or payload:'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={pasteValue}
                onChange={e => setPasteValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePasteSubmit(); }}
                placeholder="https://… or base64 payload"
                style={{
                  flex: 1,
                  fontFamily: "'Caveat', cursive",
                  fontSize: '0.9rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1.5px solid #D8D9D0',
                  outline: 'none',
                  color: '#1A1A1A',
                  padding: '0.3rem 0',
                }}
              />
              <button
                onClick={handlePasteSubmit}
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontSize: '0.85rem',
                  border: '1.5px solid #1A1A1A',
                  backgroundColor: '#1A1A1A',
                  color: '#fff',
                  padding: '0.2rem 0.65rem',
                  cursor: 'pointer',
                  borderRadius: 0,
                }}
              >
                go
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              onClick={handleClose}
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '0.85rem',
                color: '#6B6B63',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
