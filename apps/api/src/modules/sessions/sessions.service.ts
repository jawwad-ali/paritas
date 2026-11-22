import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RefreshTokenRevokeReason, type RefreshToken } from '../../generated/prisma/client.js';
import { RequestContextService } from '../../common/request-context/request-context.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.utils.js';
import { MS_PER_DAY } from './sessions.constants.js';
import type { RotationResult, SessionWriter } from './sessions.types.js';

/**
 * Refresh-token sessions with rotation and reuse detection (OAuth 2.0 Security
 * BCP §4.14). Each refresh exchanges the presented token for a new one; if a
 * token that was already exchanged shows up again, someone holds a copy, so the
 * whole token family (the login session) is revoked.
 */
@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly context: RequestContextService,
  ) {}

  /** Starts a new session (token family). Returns the raw token for the cookie. */
  async create(userId: string, writer: SessionWriter = this.prisma): Promise<string> {
    return this.issue(userId, randomUUID(), writer);
  }

  async rotate(rawToken: string): Promise<RotationResult> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });

    if (!existing) {
      return { outcome: 'invalid' };
    }
    if (existing.revokedAt) {
      return this.handleRevokedTokenPresented(existing);
    }
    if (existing.expiresAt <= new Date()) {
      return { outcome: 'invalid' };
    }

    return this.prisma.$transaction(async (tx) => {
      // Conditional update = atomic claim: of two concurrent refreshes with the
      // same token, exactly one wins; the loser gets `invalid`, not a reuse alarm.
      const claimed = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: RefreshTokenRevokeReason.ROTATED },
      });
      if (claimed.count === 0) {
        return { outcome: 'invalid' } as const;
      }
      const token = await this.issue(existing.userId, existing.familyId, tx);
      return { outcome: 'rotated', userId: existing.userId, token } as const;
    });
  }

  /** Revokes the session the token belongs to. Returns its user id, if the token was known. */
  async revokeFamilyOf(rawToken: string, reason: RefreshTokenRevokeReason): Promise<string | null> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
      select: { userId: true, familyId: true },
    });
    if (!existing) {
      return null;
    }
    await this.revokeFamily(existing.familyId, reason);
    return existing.userId;
  }

  async revokeAllForUser(
    userId: string,
    reason: RefreshTokenRevokeReason,
    writer: SessionWriter = this.prisma,
  ): Promise<void> {
    await writer.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  private async handleRevokedTokenPresented(token: RefreshToken): Promise<RotationResult> {
    if (token.revokedReason !== RefreshTokenRevokeReason.ROTATED) {
      return { outcome: 'invalid' };
    }
    await this.revokeFamily(token.familyId, RefreshTokenRevokeReason.REUSE_DETECTED);
    return { outcome: 'reuse_detected', userId: token.userId };
  }

  private async revokeFamily(familyId: string, reason: RefreshTokenRevokeReason): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  private async issue(userId: string, familyId: string, writer: SessionWriter): Promise<string> {
    const token = generateRefreshToken();
    const { ip, userAgent } = this.context.get();
    await writer.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + this.config.get('REFRESH_TOKEN_TTL_DAYS') * MS_PER_DAY),
        createdByIp: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
    return token;
  }
}
