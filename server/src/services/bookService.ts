import { prisma } from '../db';

export class BookService {
  public static async ensureDefaultBooks(userId: string) {
    const count = await prisma.book.count({ where: { userId } });
    if (count === 0) {
      await prisma.book.createMany({
        data: [
          {
            userId,
            title: 'El Obstáculo es el Camino',
            author: 'Ryan Holiday',
            currentPage: 142,
            totalPages: 280,
            status: 'CURRENT',
          },
          {
            userId,
            title: 'Pensar Rápido, Pensar Despacio',
            author: 'Daniel Kahneman',
            currentPage: 0,
            totalPages: 496,
            status: 'PENDING',
          },
          {
            userId,
            title: 'Hábitos Atómicos',
            author: 'James Clear',
            currentPage: 0,
            totalPages: 320,
            status: 'PENDING',
          },
        ],
      });
    }
  }

  public static async getBooks(userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) targetUserId = firstUser.id;
    }

    if (targetUserId) {
      await this.ensureDefaultBooks(targetUserId);
    }

    const where: any = {};
    if (targetUserId) where.userId = targetUserId;

    return prisma.book.findMany({
      where,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  public static async createBook(
    userId: string | undefined,
    data: {
      title: string;
      author: string;
      totalPages: number;
      currentPage?: number;
      status?: string;
    }
  ) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    const status = data.status || 'PENDING';

    // If marked as CURRENT, set any existing CURRENT book to PENDING
    if (status === 'CURRENT') {
      await prisma.book.updateMany({
        where: { userId: targetUserId, status: 'CURRENT' },
        data: { status: 'PENDING' },
      });
    }

    return prisma.book.create({
      data: {
        userId: targetUserId,
        title: data.title.trim(),
        author: data.author.trim(),
        totalPages: Math.max(1, Number(data.totalPages) || 100),
        currentPage: Math.max(0, Number(data.currentPage) || 0),
        status,
      },
    });
  }

  public static async updateBook(
    bookId: string,
    data: {
      title?: string;
      author?: string;
      totalPages?: number;
      currentPage?: number;
      status?: string;
    }
  ) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.author !== undefined) updateData.author = data.author.trim();
    if (data.totalPages !== undefined) updateData.totalPages = Math.max(1, Number(data.totalPages));
    if (data.currentPage !== undefined) updateData.currentPage = Math.max(0, Number(data.currentPage));
    if (data.status !== undefined) updateData.status = data.status;

    // If currentPage >= totalPages, can auto-mark as COMPLETED if not specified otherwise
    if (
      updateData.currentPage !== undefined &&
      updateData.totalPages !== undefined &&
      updateData.currentPage >= updateData.totalPages &&
      !data.status
    ) {
      updateData.status = 'COMPLETED';
    }

    return prisma.book.update({
      where: { id: bookId },
      data: updateData,
    });
  }

  public static async startReading(bookId: string, userId?: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new Error('Book not found');

    const targetUserId = userId || book.userId;

    // Demote any current book to PENDING
    await prisma.book.updateMany({
      where: { userId: targetUserId, status: 'CURRENT' },
      data: { status: 'PENDING' },
    });

    // Set selected book as CURRENT
    return prisma.book.update({
      where: { id: bookId },
      data: { status: 'CURRENT' },
    });
  }

  public static async deleteBook(bookId: string) {
    return prisma.book.delete({
      where: { id: bookId },
    });
  }
}
