import { Request, Response } from 'express';
import { BookService } from '../services/bookService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class BookController {
  public static async getBooks(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const books = await BookService.getBooks(userId);
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createBook(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { title, author, totalPages, currentPage, status } = req.body;
      if (!title || !author) {
        return res.status(400).json({ error: 'Título y autor son obligatorios' });
      }
      const book = await BookService.createBook(userId, {
        title,
        author,
        totalPages: Number(totalPages) || 100,
        currentPage: Number(currentPage) || 0,
        status,
      });
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateBook(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const book = await BookService.updateBook(id, req.body);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async startReading(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = (req as AuthenticatedRequest).userId;
      const book = await BookService.startReading(id, userId);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteBook(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await BookService.deleteBook(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async addBookNote(req: Request, res: Response) {
    try {
      const bookId = req.params.id as string;
      const { content, chapter, page } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'El contenido del aprendizaje o tip es obligatorio' });
      }
      const note = await BookService.addBookNote(bookId, { content, chapter, page });
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async getBookNotes(req: Request, res: Response) {
    try {
      const bookId = req.params.id as string;
      const notes = await BookService.getBookNotes(bookId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async deleteBookNote(req: Request, res: Response) {
    try {
      const noteId = req.params.noteId as string;
      await BookService.deleteBookNote(noteId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

