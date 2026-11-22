import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { ARGON2_OPTIONS, TIMING_EQUALIZER_PASSWORD } from './password.constants.js';

@Injectable()
export class PasswordHasher {
  private timingEqualizerHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  /** Never throws: a malformed stored hash is treated as a mismatch. */
  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Burns the same CPU/memory as a real verification. Call it when the account
   * does not exist, so response time does not reveal which emails are registered.
   */
  async verifyAgainstDummy(password: string): Promise<void> {
    this.timingEqualizerHash ??= this.hash(TIMING_EQUALIZER_PASSWORD);
    await this.verify(await this.timingEqualizerHash, password);
  }
}
