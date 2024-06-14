import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: number) {
    return await this.prisma.bookmarks.findMany({
      where: { userId },
    });
  }
  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    return await this.prisma.bookmarks.create({
      data: { userId, ...dto },
    });
  }
  async getBookmarksById(userId: number, bookmarkId: number) {
    if (userId !== bookmarkId) {
      throw new ForbiddenException('Invalid request');
    }

    return await this.prisma.bookmarks.findFirst({
      where: { id: bookmarkId },
    });
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    const bookmark = await this.prisma.bookmarks.findFirst({
      where: { id: bookmarkId },
    });

    if (!bookmark || userId !== bookmarkId) {
      throw new ForbiddenException('Access Denied');
    }

    return await this.prisma.bookmarks.update({
      where: { id: bookmarkId },
      data: dto,
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    if (userId !== bookmarkId) {
      throw new ForbiddenException('Invalid request');
    }

    const bookmark = await this.prisma.bookmarks.findFirst({
      where: { id: bookmarkId },
    });

    if (!bookmark || userId !== bookmarkId) {
      throw new ForbiddenException('Access Denied');
    }

    return await this.prisma.bookmarks.delete({
      where: { id: bookmarkId },
    });
  }
}
