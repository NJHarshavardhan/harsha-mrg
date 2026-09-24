import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Trash2, 
  Check, 
  PenTool, 
  Sparkles,
  Download,
  Image as ImageIcon
} from 'lucide-react';

interface HandwritingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (recognizedText: string, drawingDataUrl?: string) => void;
  initialText?: string;
  initialDrawing?: string;
  fieldLabel?: string;
  isNumericOnly?: boolean;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

const INK_COLORS = [
  { label: 'Black Ink', hex: '#0f172a' },
  { label: 'Royal Blue', hex: '#1d4ed8' },
  { label: 'Emerald Green', hex: '#047857' },
  { label: 'Ruby Red', hex: '#b91c1c' },
];

const PEN_WIDTHS = [
  { label: 'Thin', width: 2.5 },
  { label: 'Medium', width: 4.5 },
  { label: 'Thick', width: 7 },
];

export function HandwritingCanvasModal({
  isOpen,
  onClose,
  onApply,
  initialText = '',
  initialDrawing,
  fieldLabel = 'Input Field',
  isNumericOnly = false,
}: HandwritingCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const [recognizedText, setRecognizedText] = useState(initialText);
  const [activeColor, setActiveColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(4.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | undefined>(initialDrawing);

  useEffect(() => {
    if (isOpen) {
      setRecognizedText(initialText);
      setStrokes([]);
      setCurrentStroke([]);
      setPreviewDataUrl(initialDrawing);
      setTimeout(redrawCanvas, 60);
    }
  }, [isOpen, initialText, initialDrawing]);

  // Redraw canvas whenever strokes update
  useEffect(() => {
    redrawCanvas();
    if (strokes.length > 0) {
      const cropped = getCroppedDrawingDataUrl(strokes);
      setPreviewDataUrl(cropped);
    } else {
      setPreviewDataUrl(undefined);
    }
  }, [strokes, currentStroke]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid guide lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Baseline rule
    ctx.strokeStyle = '#e2e8f0';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(12, canvas.height * 0.72);
    ctx.lineTo(canvas.width - 12, canvas.height * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw committed strokes
    const allStrokes = [...strokes];
    if (currentStroke.length > 0) {
      allStrokes.push({
        points: currentStroke,
        color: activeColor,
        width: penWidth,
      });
    }

    allStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
    });
  };

  // Crops what the user drew into a crisp, trimmed PNG image
  const getCroppedDrawingDataUrl = (strokeList: Stroke[]): string | undefined => {
    if (strokeList.length === 0) return undefined;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    strokeList.forEach((s) => {
      s.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    if (minX === Infinity || maxX === -Infinity) return undefined;

    const padding = 16;
    const canvasWidth = canvasRef.current?.width || 480;
    const canvasHeight = canvasRef.current?.height || 200;

    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const rawW = (maxX - minX) + padding * 2;
    const rawH = (maxY - minY) + padding * 2;
    const cropW = Math.min(canvasWidth - cropX, Math.max(rawW, 60));
    const cropH = Math.min(canvasHeight - cropY, Math.max(rawH, 40));

    // High-resolution offscreen canvas
    const offscreen = document.createElement('canvas');
    const dpr = 2;
    offscreen.width = cropW * dpr;
    offscreen.height = cropH * dpr;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return undefined;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropW, cropH);

    ctx.translate(-cropX, -cropY);

    strokeList.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    });

    return offscreen.toDataURL('image/png');
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getCanvasCoords(e);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasCoords(e);
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const newStrokes = [
        ...strokes,
        {
          points: currentStroke,
          color: activeColor,
          width: penWidth,
        },
      ];
      setStrokes(newStrokes);
      setCurrentStroke([]);
      autoRecognizeStrokes(newStrokes);
    } else {
      setCurrentStroke([]);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    autoRecognizeStrokes(newStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setRecognizedText('');
    setPreviewDataUrl(undefined);
    redrawCanvas();
  };

  // Stroke shape recognition assistant
  const autoRecognizeStrokes = (strokeList: Stroke[]) => {
    if (strokeList.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      interface Glyph {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        strokes: Stroke[];
      }

      const glyphs: Glyph[] = [];
      strokeList.forEach((stroke) => {
        let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
        stroke.points.forEach((p) => {
          if (p.x < sMinX) sMinX = p.x;
          if (p.x > sMaxX) sMaxX = p.x;
          if (p.y < sMinY) sMinY = p.y;
          if (p.y > sMaxY) sMaxY = p.y;
        });

        const existing = glyphs.find((g) => {
          const overlap = Math.max(0, Math.min(g.maxX, sMaxX) - Math.max(g.minX, sMinX));
          return overlap > 5 || (sMinX >= g.minX - 10 && sMaxX <= g.maxX + 10);
        });

        if (existing) {
          existing.minX = Math.min(existing.minX, sMinX);
          existing.maxX = Math.max(existing.maxX, sMaxX);
          existing.minY = Math.min(existing.minY, sMinY);
          existing.maxY = Math.max(existing.maxY, sMaxY);
          existing.strokes.push(stroke);
        } else {
          glyphs.push({
            minX: sMinX,
            maxX: sMaxX,
            minY: sMinY,
            maxY: sMaxY,
            strokes: [stroke],
          });
        }
      });

      glyphs.sort((a, b) => a.minX - b.minX);

      const recognizedChars: string[] = glyphs.map((g) => {
        const width = g.maxX - g.minX;
        const height = g.maxY - g.minY;
        const aspectRatio = width / (height || 1);
        const allPoints = g.strokes.flatMap((s) => s.points);
        const strokeCount = g.strokes.length;

        if (width < 12 && height < 12) return '.';
        if (aspectRatio < 0.35 && height > 25) return '1';

        const firstPoint = allPoints[0];
        const lastPoint = allPoints[allPoints.length - 1];
        const isClosed = Math.hypot(firstPoint.x - lastPoint.x, firstPoint.y - lastPoint.y) < Math.max(18, height * 0.3);

        if (isClosed && strokeCount === 1) {
          if (aspectRatio > 0.6 && aspectRatio < 1.3) return '0';
        }

        if (strokeCount === 2) return isNumericOnly ? '4' : 'T';
        if (strokeCount === 3) return isNumericOnly ? '5' : 'E';

        const midY = (g.minY + g.maxY) / 2;
        const upperPoints = allPoints.filter((p) => p.y < midY);
        const lowerPoints = allPoints.filter((p) => p.y >= midY);

        if (upperPoints.length > lowerPoints.length * 1.5) return '7';
        if (lowerPoints.length > upperPoints.length * 1.5) return '2';

        return isNumericOnly ? '5' : '';
      });

      const result = recognizedChars.join('');
      if (result) {
        setRecognizedText(result);
      }
    } catch (err) {
      console.warn('Handwriting parsing notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Store the handwritten drawing itself
  const handleStoreDrawingOnly = () => {
    const drawingUrl = getCroppedDrawingDataUrl(strokes) || previewDataUrl;
    // If recognized text is empty, provide a sensible label so the text input isn't blank
    const textToApply = recognizedText.trim() || '✍️ Handwritten Note';
    onApply(textToApply, drawingUrl);
    onClose();
  };

  // Action: Apply both the recognized text and store the handwritten drawing
  const handleApplyBoth = () => {
    const drawingUrl = getCroppedDrawingDataUrl(strokes) || previewDataUrl;
    onApply(recognizedText.trim(), drawingUrl);
    onClose();
  };

  const quickDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '000'];
  const quickAmountPads = ['500', '1000', '2000', '5000', '10000', '25000', '50000'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150 max-h-[95vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>Handwritten Pad & Drawing Storage</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  Stores what you write
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Write with touch, stylus, or mouse for: <span className="font-semibold text-slate-700">{fieldLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas & Tools Area */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Top Pen & Ink Palette Bar */}
          <div className="flex items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
            {/* Color swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 pr-1">Ink:</span>
              {INK_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setActiveColor(c.hex)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    activeColor === c.hex ? 'scale-115 border-slate-900 shadow-xs' : 'border-white opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            {/* Pen Stroke Size */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Stroke:</span>
              {PEN_WIDTHS.map((pw) => (
                <button
                  type="button"
                  key={pw.label}
                  onClick={() => setPenWidth(pw.width)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    penWidth === pw.width
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pw.label}
                </button>
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                title="Undo last stroke"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                title="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Drawing Canvas */}
          <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={480}
              height={190}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-48 cursor-crosshair touch-none select-none bg-white"
            />

            {/* Canvas Empty State Hint */}
            {strokes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1">
                <span className="font-semibold text-slate-500">✍️ Handwrite anything here</span>
                <span className="text-[11px] text-slate-400">English, தமிழ், numbers, receipt notes, signatures</span>
              </div>
            )}

            {/* Live Indicator */}
            {strokes.length > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                <span>{strokes.length} strokes recorded</span>
              </div>
            )}
          </div>

          {/* Stored Handwriting Preview (What you wrote is captured!) */}
          {previewDataUrl && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                    <span>Captured Handwritten Drawing</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 uppercase font-semibold">
                      Stored
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-700 truncate">
                    This exact handwritten image will be attached & stored directly on the record
                  </p>
                </div>
              </div>

              {/* Thumbnail of what the user drew */}
              <div className="shrink-0 bg-white p-1 rounded-lg border border-indigo-200 shadow-2xs">
                <img 
                  src={previewDataUrl} 
                  alt="Handwritten note preview" 
                  className="h-9 max-w-[120px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Optional Text / Digit Recognition Box */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Text / Digits for input:</span>
              </span>
              {isProcessing && (
                <span className="text-[10px] text-indigo-600 animate-pulse font-medium">
                  Analyzing handwriting...
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={recognizedText}
                onChange={(e) => setRecognizedText(e.target.value)}
                placeholder="Optional text to accompany the handwriting..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Quick Digit / Amount Boosters */}
          <div className="space-y-1 pt-0.5">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Quick Touch Helpers:
            </div>
            {isNumericOnly ? (
              <div className="flex flex-wrap gap-1.5">
                {quickAmountPads.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setRecognizedText(amt)}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {quickDigits.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setRecognizedText((prev) => prev + d)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {/* 1. Store What I Wrote Itself */}
            <button
              type="button"
              onClick={handleStoreDrawingOnly}
              disabled={strokes.length === 0 && !previewDataUrl}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Store this exact handwritten drawing directly on the record"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Store What I Wrote</span>
            </button>

            {/* 2. Apply Both Drawing & Text */}
            <button
              type="button"
              onClick={handleApplyBoth}
              disabled={strokes.length === 0 && !recognizedText.trim()}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Apply both the text and store the handwriting"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Text & Handwriting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
