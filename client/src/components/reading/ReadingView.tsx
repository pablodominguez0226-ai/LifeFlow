import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BookOpen,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Bookmark,
  TrendingUp,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  status: 'CURRENT' | 'PENDING' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

export const ReadingView: React.FC = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new book
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTotalPages, setNewTotalPages] = useState<number | ''>(250);
  const [newCurrentPage, setNewCurrentPage] = useState<number | ''>(0);
  const [newIsCurrent, setNewIsCurrent] = useState(false);

  // Input states for currently reading book
  const [pageInputs, setPageInputs] = useState<Record<string, string>>({});
  const [updatingPage, setUpdatingPage] = useState<Record<string, boolean>>({});

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await api.getBooks();
      setBooks(data);
      // Initialize page inputs
      const initialInputs: Record<string, string> = {};
      data.forEach((b: BookItem) => {
        initialInputs[b.id] = String(b.currentPage);
      });
      setPageInputs(initialInputs);
    } catch (err) {
      console.error('Error cargando libros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const currentBook = books.find((b) => b.status === 'CURRENT');
  const pendingBooks = books.filter((b) => b.status === 'PENDING');
  const completedBooks = books.filter((b) => b.status === 'COMPLETED');

  const handleUpdatePage = async (bookId: string, customPage?: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const pageValue = customPage !== undefined ? customPage : Number(pageInputs[bookId]);
    if (isNaN(pageValue) || pageValue < 0) return;

    const clampedPage = Math.min(book.totalPages, Math.max(0, pageValue));

    // Optimistic UI update
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, currentPage: clampedPage } : b))
    );
    setPageInputs((prev) => ({ ...prev, [bookId]: String(clampedPage) }));

    try {
      setUpdatingPage((prev) => ({ ...prev, [bookId]: true }));
      const updated = await api.updateBook(bookId, { currentPage: clampedPage });
      // If book reached total pages, refresh list to show updated status
      if (updated.status !== book.status) {
        loadBooks();
      }
    } catch (err) {
      console.error('Error actualizando página:', err);
      loadBooks();
    } finally {
      setUpdatingPage((prev) => ({ ...prev, [bookId]: false }));
    }
  };

  const handleStartReading = async (bookId: string) => {
    try {
      await api.startReadingBook(bookId);
      loadBooks();
    } catch (err) {
      console.error('Error comenzando libro:', err);
    }
  };

  const handleCompleteBook = async (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    try {
      await api.updateBook(bookId, {
        currentPage: book.totalPages,
        status: 'COMPLETED',
      });
      loadBooks();
    } catch (err) {
      console.error('Error completando libro:', err);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('¿Eliminar este libro de tu lista?')) return;
    try {
      await api.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error('Error eliminando libro:', err);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    try {
      await api.createBook({
        title: newTitle.trim(),
        author: newAuthor.trim(),
        totalPages: Number(newTotalPages) || 100,
        currentPage: Number(newCurrentPage) || 0,
        status: newIsCurrent ? 'CURRENT' : 'PENDING',
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAuthor('');
      setNewTotalPages(250);
      setNewCurrentPage(0);
      setNewIsCurrent(false);
      loadBooks();
    } catch (err) {
      console.error('Error creando libro:', err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#09090B] text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Lectura Personal & Desarrollo
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 pl-10.5">
            Desconexión de pantallas, foco cognitivo y lista de espera de libros formativos
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-[#E4E4E7] shadow transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Agregar Libro</span>
        </button>
      </div>

      {/* SECTION 1: LEYENDO ACTUALMENTE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 font-mono">
              Leyendo Actualmente
            </h3>
          </div>
          {currentBook && (
            <span className="text-[11px] font-mono text-zinc-500">
              Progreso en tiempo real
            </span>
          )}
        </div>

        {currentBook ? (
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Book Info */}
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] text-[10px] font-mono uppercase font-bold text-zinc-300">
                  <Bookmark className="w-3 h-3 text-white" />
                  Libro Activo
                </div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentBook.title}
                </h4>
                <p className="text-sm text-zinc-400 font-medium">
                  por <span className="text-zinc-200">{currentBook.author}</span>
                </p>
              </div>

              {/* Percentage & Quick Finish */}
              <div className="flex items-center md:flex-col md:items-end gap-3 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {Math.min(
                      100,
                      Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
                    )}
                    %
                  </span>
                  <span className="block text-[11px] text-zinc-500 font-mono">completado</span>
                </div>

                <button
                  onClick={() => handleCompleteBook(currentBook.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Marcar este libro como 100% terminado"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Terminar libro</span>
                </button>
              </div>
            </div>

            {/* Progress Bar (Monochromatic Zinc / White) */}
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-[#18181B] border border-[#27272A] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>
                  Página <strong>{currentBook.currentPage}</strong> de{' '}
                  <strong>{currentBook.totalPages}</strong>
                </span>
                <span>
                  {Math.max(0, currentBook.totalPages - currentBook.currentPage)} páginas restantes
                </span>
              </div>
            </div>

            {/* Mobile-Friendly Quick Tactile Advance Buttons */}
            <div className="pt-4 border-t border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Avance Rápido de Lectura
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Toca para sumar páginas
                </span>
              </div>

              {/* Large Tactile Buttons (+5, +10, +20) */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() =>
                    handleUpdatePage(
                      currentBook.id,
                      Math.min(currentBook.totalPages, currentBook.currentPage + 5)
                    )
                  }
                  disabled={updatingPage[currentBook.id] || currentBook.currentPage >= currentBook.totalPages}
                  className="py-3 px-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-zinc-500 active:bg-white active:text-zinc-950 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <span className="text-zinc-400">+</span>
                  <span>5 págs</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdatePage(
                      currentBook.id,
                      Math.min(currentBook.totalPages, currentBook.currentPage + 10)
                    )
                  }
                  disabled={updatingPage[currentBook.id] || currentBook.currentPage >= currentBook.totalPages}
                  className="py-3 px-3 rounded-xl bg-white text-zinc-950 hover:bg-[#E4E4E7] font-mono font-black text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <span>+10 págs</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdatePage(
                      currentBook.id,
                      Math.min(currentBook.totalPages, currentBook.currentPage + 20)
                    )
                  }
                  disabled={updatingPage[currentBook.id] || currentBook.currentPage >= currentBook.totalPages}
                  className="py-3 px-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-zinc-500 active:bg-white active:text-zinc-950 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <span className="text-zinc-400">+</span>
                  <span>20 págs</span>
                </button>
              </div>

              {/* Exact Page Input (Fallback / Desktop) */}
              <div className="pt-3 border-t border-[#27272A]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 font-medium">O ingresar número exacto:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={currentBook.totalPages}
                      value={pageInputs[currentBook.id] ?? currentBook.currentPage}
                      onChange={(e) =>
                        setPageInputs({ ...pageInputs, [currentBook.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePage(currentBook.id);
                        }
                      }}
                      className="w-20 px-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-white font-mono text-center text-sm font-bold focus:outline-none focus:border-white transition-colors"
                    />
                    <button
                      onClick={() => handleUpdatePage(currentBook.id)}
                      disabled={updatingPage[currentBook.id]}
                      className="px-3.5 py-1.5 bg-[#18181B] hover:bg-white hover:text-zinc-950 border border-[#27272A] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>

                {currentBook.currentPage > 0 && (
                  <button
                    onClick={() =>
                      handleUpdatePage(
                        currentBook.id,
                        Math.max(0, currentBook.currentPage - 5)
                      )
                    }
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 underline font-mono cursor-pointer"
                  >
                    Corregir (-5 págs)
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#121215] border border-dashed border-[#27272A] rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center mx-auto text-zinc-500">
              <BookOpen className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-base font-bold text-white">No hay ningún libro activo actualmente</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Selecciona uno de tus libros en espera con el botón <strong>&quot;Comenzar a leer&quot;</strong> o agrega una nueva lectura a tu lista.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: PRÓXIMOS LIBROS (LISTA DE ESPERA) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 font-mono">
              Próximos Libros ({pendingBooks.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Libro</span>
          </button>
        </div>

        {pendingBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBooks.map((book) => (
              <div
                key={book.id}
                className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-zinc-600 transition-colors shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#18181B] text-zinc-400 border border-[#27272A]">
                      En espera
                    </span>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-[#18181B] transition-colors cursor-pointer"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h5 className="text-base font-bold text-white tracking-tight leading-snug">
                    {book.title}
                  </h5>
                  <p className="text-xs text-zinc-400">{book.author}</p>
                </div>

                <div className="pt-3 border-t border-[#27272A] flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">
                    {book.totalPages} páginas
                  </span>

                  <button
                    onClick={() => handleStartReading(book.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Comenzar a leer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[#121215] border border-[#27272A] rounded-2xl text-center space-y-2">
            <p className="text-xs text-zinc-400">
              No tienes libros pendientes en tu lista de espera.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-white font-bold underline hover:text-zinc-300 cursor-pointer"
            >
              + Agregar tu próximo libro
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: LIBROS COMPLETADOS (HISTORIAL) */}
      {completedBooks.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#27272A]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
              Lecturas Completadas ({completedBooks.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedBooks.map((book) => (
              <div
                key={book.id}
                className="p-4 bg-[#121215] border border-[#27272A] rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h6 className="font-bold text-zinc-200 line-clamp-1">{book.title}</h6>
                  <p className="text-[11px] text-zinc-500">
                    {book.author} · {book.totalPages} págs.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartReading(book.id)}
                    className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    title="Releer este libro"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-[#18181B] transition-colors"
                    title="Eliminar libro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR LIBRO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-white" />
                <h3 className="text-base font-bold text-white">Agregar Nuevo Libro</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold block">Título de la obra</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: El Obstáculo es el Camino"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold block">Autor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ryan Holiday"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-semibold block">Total de páginas</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newTotalPages}
                      onChange={(e) => setNewTotalPages(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white font-mono focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-semibold block">Página actual (opcional)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCurrentPage}
                      onChange={(e) => setNewCurrentPage(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white font-mono focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-3 bg-[#18181B] border border-[#27272A] rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={newIsCurrent}
                    onChange={(e) => setNewIsCurrent(e.target.checked)}
                    className="rounded border-zinc-700 bg-black text-white focus:ring-0 cursor-pointer"
                  />
                  <span className="text-zinc-300 font-medium select-none">
                    Comenzar a leer este libro inmediatamente
                  </span>
                </label>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18181B] border border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-500 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-[#E4E4E7] shadow transition-all cursor-pointer"
                >
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
