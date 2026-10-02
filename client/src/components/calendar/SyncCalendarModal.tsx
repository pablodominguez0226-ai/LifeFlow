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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-zinc-300" />
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
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
          {/* Option 1: Live Feed URL (Subscription) */}
          <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  1. Suscripción en Tiempo Real (Recomendado)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#09090B] text-zinc-300 border border-[#27272A] font-bold">
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
                className="flex-1 bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono select-all focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => handleCopy(fullUrl)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#E4E4E7] text-zinc-950 rounded-xl text-xs font-semibold transition-all shrink-0 shadow-sm cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950" />
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
          <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  2. Descargar Archivo iCalendar (.ics)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#09090B] text-zinc-400 border border-[#27272A]">
                Snapshot local
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Descarga un archivo estático compatible con Outlook, Apple iCal o para importar manualmente una sola vez.
            </p>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#121215] hover:bg-[#27272A] text-white rounded-xl text-xs font-semibold border border-[#27272A] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Descargar lifeflow-calendar.ics</span>
            </button>
          </div>

          {/* 3-Step Google Calendar Instructions */}
          <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Smartphone className="w-4 h-4 text-zinc-400" />
              <span>Cómo añadir la URL en Google Calendar:</span>
            </div>

            <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside leading-relaxed font-sans">
              <li>
                Abre <span className="text-white font-medium">Google Calendar</span> en tu navegador.
              </li>
              <li>
                En el lateral izquierdo, junto a <span className="text-white font-medium">"Otros calendarios"</span>, haz clic en el icono <span className="text-zinc-200 font-bold font-mono">+</span> y elige <span className="text-white font-medium">"Desde URL"</span>.
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
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#18181B] hover:border-zinc-500 text-zinc-300 rounded-xl text-xs font-semibold border border-[#27272A] hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
