import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Smartphone,
  Sparkles,
  Info,
} from 'lucide-react';

interface SyncCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCalendarModal: React.FC<SyncCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Resolve current host feed URL
  const feedPath = '/api/calendar/feed.ics';
  const fullUrl = `${window.location.origin}${feedPath}`;
  const webcalUrl = fullUrl.replace(/^https?:\/\//, 'webcal://');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${feedPath}?download=true`;
    link.setAttribute('download', 'lifeflow-calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-red-intense" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Sincronizar con Google & Apple Calendar
              </h3>
              <p className="text-xs text-zinc-400">
                Lleva tus cursadas, gimnasio y bloques de estudio a tu móvil y calendario habitual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-dark-cardSecondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Live Feed URL (Subscription) */}
        <div className="p-4 bg-dark-cardSecondary border border-dark-borderSubtle rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-intense" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                1. Suscripción en Tiempo Real (Recomendado)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60 font-bold">
              Auto-actualizable
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Cualquier cambio, replanificación o nueva cursada en LifeFlow se reflejará automáticamente en tus dispositivos.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="flex-1 bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono select-all focus:outline-none focus:border-red-intense"
            />
            <button
              onClick={() => handleCopy(fullUrl)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Option 2: Direct ICS Download */}
        <div className="p-4 bg-dark-cardSecondary border border-dark-borderSubtle rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-accent-orange" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                2. Descargar Archivo iCalendar (.ics)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              Snapshot local
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Descarga un archivo estático compatible con Outlook, Apple iCal o para importar manualmente una sola vez.
          </p>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 w-full py-2 bg-dark-card hover:bg-zinc-800 text-white rounded-xl text-xs font-bold border border-dark-border hover:border-zinc-600 transition-all"
          >
            <Download className="w-4 h-4 text-accent-orange" />
            <span>Descargar lifeflow-calendar.ics</span>
          </button>
        </div>

        {/* 3-Step Google Calendar Instructions */}
        <div className="p-4 bg-black/60 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <span>Cómo añadir la URL en Google Calendar:</span>
          </div>

          <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside leading-relaxed font-sans">
            <li>
              Abre <span className="text-white font-medium">Google Calendar</span> en tu navegador.
            </li>
            <li>
              En el lateral izquierdo, junto a <span className="text-white font-medium">"Otros calendarios"</span>, haz clic en el icono <span className="text-red-400 font-bold font-mono">+</span> y elige <span className="text-white font-medium">"Desde URL"</span>.
            </li>
            <li>
              Pega la <span className="text-white font-mono text-[11px]">URL de LifeFlow</span> y pulsa <span className="text-white font-medium">"Añadir calendario"</span>.
            </li>
          </ol>

          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Los eventos incluyen el tipo de flexibilidad, notas y justificación cognitiva.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-dark-cardSecondary hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold border border-dark-border transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
