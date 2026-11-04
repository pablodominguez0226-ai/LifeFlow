import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Bookmark,
  TrendingUp,
  X,
  Check,
  RotateCcw,
  RefreshCw,
  Library,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface BookOverviewItem {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: string;
  category: string;
  dailyTargetMin: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BooksOverviewResponse {
  currentBook: BookOverviewItem | null;
  queuedBooks: BookOverviewItem[];
}

export const LecturaPage: React.FC = () => {
  const [data, setData] = useState<BooksOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal "+ Registrar Páginas"
  const [isRegisterPagesOpen, setIsRegisterPagesOpen] = useState(false);
  const [newPageValue, setNewPageValue] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);

  // Modal "+ Agregar Libro"
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTotalPages, setNewTotalPages] = useState<number>(300);
  const [newCategory, setNewCategory] = useState('Desarrollo Personal & Negocios');
  const [newDailyTarget, setNewDailyTarget] = useState<number>(30);
  const [addingBook, setAddingBook] = useState(false);

  const loadData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      else setSyncing(true);
      const res = await api.getBooksOverview();
      setData(res);
      if (res.currentBook) {
        setNewPageValue(res.currentBook.currentPage);
      }
    } catch (err) {
      console.error('Error cargando visión de lectura:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler: "+ Registrar Páginas"
  const handleSavePages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.currentBook) return;

    const bookId = data.currentBook.id;
    const clampedPage = Math.min(data.currentBook.totalPages, Math.max(0, Number(newPageValue) || 0));

    // Optimistic UI update
    const prevData = { ...data };
    setData({
      ...data,
      currentBook: {
        ...data.currentBook,
        currentPage: clampedPage,
      },
    });
    setIsRegisterPagesOpen(false);

    try {
      setSavingProgress(true);
      await api.updateBookStatusOrPages(bookId, { currentPage: clampedPage });
    } catch (err) {
      console.error('Error guardando progreso de páginas:', err);
      setData(prevData);
    } finally {
      setSavingProgress(false);
    }
  };

  // Handler: "Terminar Lectura"
  const handleFinishReading = async () => {
    if (!data?.currentBook) return;
    const confirmFinish = window.confirm(
      `¿Marcar "${data.currentBook.title}" como terminado?`
    );
    if (!confirmFinish) return;

    const prevData = { ...data };
    const finishedBook = { ...data.currentBook, status: 'FINISHED' };

    // Optimistic: move next book from queue if available
    const nextBook = data.queuedBooks[0] || null;
    const remainingQueued = data.queuedBooks.slice(1);

    setData({
      currentBook: nextBook ? { ...nextBook, status: 'READING' } : null,
      queuedBooks: remainingQueued,
    });

    try {
      await api.updateBookStatusOrPages(finishedBook.id, { status: 'FINISHED' });
      if (nextBook) {
        await api.updateBookStatusOrPages(nextBook.id, { status: 'READING' });
      }
      loadData(false);
    } catch (err) {
      console.error('Error finalizando libro:', err);
      setData(prevData);
    }
  };

  // Handler: "+ Agregar Libro"
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    setAddingBook(true);
    const tempId = `temp-${Date.now()}`;
    const newBookItem: BookOverviewItem = {
      id: tempId,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      totalPages: Number(newTotalPages) || 200,
      currentPage: 0,
      status: 'QUEUED',
      category: newCategory.trim() || 'General',
      dailyTargetMin: Number(newDailyTarget) || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    const prevQueued = data?.queuedBooks || [];
    if (data) {
      setData({
        ...data,
        queuedBooks: [...data.queuedBooks, newBookItem],
      });
    }

    setIsAddBookOpen(false);
    setNewTitle('');
    setNewAuthor('');
    setNewTotalPages(300);

    try {
      const created = await api.createBookQueued({
        title: newBookItem.title,
        author: newBookItem.author,
        totalPages: newBookItem.totalPages,
        category: newBookItem.category,
        dailyTargetMin: newBookItem.dailyTargetMin,
        status: 'QUEUED',
      });
      if (data) {
        setData({
          ...data,
          queuedBooks: [...prevQueued, created],
        });
      }
    } catch (err) {
      console.error('Error al agregar libro:', err);
      if (data) {
        setData({
          ...data,
          queuedBooks: prevQueued,
        });
      }
    } finally {
      setAddingBook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <RefreshCw className="w-7 h-7 animate-spin text-purple-500" />
        <p className="text-sm font-medium">Cargando biblioteca y lecturas en curso...</p>
      </div>
    );
  }

  const currentBook = data?.currentBook;
  const queuedBooks = data?.queuedBooks || [];

  // Calcular porcentaje exacto
  const progressPercent = currentBook && currentBook.totalPages > 0
    ? Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in text-white">
      {/* Header View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272A]/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hábito & Biblioteca de Lectura
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Activo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tracking diario de páginas leídas, metas de foco y biblioteca de próximos libros.
          </p>
        </div>

        <button
          onClick={() => loadData(false)}
          disabled={syncing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#121215] border border-[#27272A] hover:border-zinc-600 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-purple-400' : 'text-zinc-400'}`} />
          <span>{syncing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* 1. SECCIÓN: LEYENDO ACTUALMENTE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Leyendo Actualmente
          </h2>
        </div>

        {currentBook ? (
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-all">
            {/* Subtle glowing background accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Book Details */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/25">
                    {currentBook.category || 'Lectura Principal'}
                  </span>
                  {/* Badge de meta diaria: "30 min diarios" */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentBook.dailyTargetMin || 30} min diarios</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentBook.title}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-zinc-400 mt-1">
                    {currentBook.author}
                  </p>
                </div>

                {/* Progress bar and page counts: 135 / 240 páginas (56%) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-zinc-300 font-semibold">
                      {`${currentBook.currentPage} / ${currentBook.totalPages} páginas`}
                    </span>
                    <span className="font-extrabold text-purple-400">
                      {`${progressPercent}%`}
                    </span>
                  </div>

                  <div className="w-full bg-[#18181B] rounded-full h-3 overflow-hidden border border-zinc-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Botones de Acción */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:min-w-[200px]">
                {/* Botón "+ Registrar Páginas" */}
                <button
                  onClick={() => {
                    setNewPageValue(currentBook.currentPage);
                    setIsRegisterPagesOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Registrar Páginas</span>
                </button>

                {/* Botón "Terminar Lectura" */}
                <button
                  onClick={handleFinishReading}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] hover:border-zinc-600 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition-all active:scale-98 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Terminar Lectura</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#121215] border border-dashed border-[#27272A] rounded-2xl p-8 text-center text-zinc-400">
            <BookOpen className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No hay ningún libro en lectura activa.</p>
            <p className="text-xs text-zinc-500 mt-1">Selecciona uno de la lista de próximos libros para comenzar.</p>
          </div>
        )}
      </section>

      {/* 2. SECCIÓN: PRÓXIMOS LIBROS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Próximos Libros
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              {queuedBooks.length}
            </span>
          </div>

          {/* Botón "+ Agregar Libro" que abre modal sin saltar de pantalla */}
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-98 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Agregar Libro</span>
          </button>
        </div>

        {queuedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queuedBooks.map((book) => (
              <div
                key={book.id}
                className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                      {book.category || 'Técnico'}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {book.totalPages} págs
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {book.author}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#27272A]/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{book.dailyTargetMin || 30} min diarios</span>
                  </div>

                  <span className="text-[11px] font-semibold text-zinc-500">
                    En cola
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#121215] border border-dashed border-[#27272A] rounded-2xl p-8 text-center text-zinc-400">
            <Bookmark className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No hay libros en la lista de espera.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Usa el botón "+ Agregar Libro" para planificar tus próximas lecturas.
            </p>
          </div>
        )}
      </section>

      {/* MODAL: Registrar Páginas */}
      {isRegisterPagesOpen && currentBook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registrar Páginas
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterPagesOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePages} className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400">
                  Libro: <strong className="text-white">{currentBook.title}</strong>
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Página actual: {currentBook.currentPage} / {currentBook.totalPages}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Página alcanzada hoy
                </label>
                <input
                  type="number"
                  min={0}
                  max={currentBook.totalPages}
                  value={newPageValue}
                  onChange={(e) => setNewPageValue(Number(e.target.value))}
                  className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none transition-colors"
                  placeholder="Ej: 150"
                  autoFocus
                  required
                />
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center gap-2 pt-1">
                {[10, 20, 30].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() =>
                      setNewPageValue((prev) =>
                        Math.min(currentBook.totalPages, prev + inc)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    +{inc} págs
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsRegisterPagesOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProgress}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {savingProgress ? 'Guardando...' : 'Guardar Progreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Próximo Libro */}
      {isAddBookOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Agregar Próximo Libro
                </h3>
              </div>
              <button
                onClick={() => setIsAddBookOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Título del Libro *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                  placeholder="Ej: Clean Code"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Autor *
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                  placeholder="Ej: Robert C. Martin"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Total de Páginas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTotalPages}
                    onChange={(e) => setNewTotalPages(Number(e.target.value))}
                    className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Meta Diaria (minutos)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={newDailyTarget}
                    onChange={(e) => setNewDailyTarget(Number(e.target.value))}
                    className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Categoría
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                  placeholder="Ej: Arquitectura de Software, Trading, Filosofía"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsAddBookOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingBook}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {addingBook ? 'Guardando...' : 'Agregar a la Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturaPage;
