import { compare, hash } from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plainTextPassword, passwordHash);
}
