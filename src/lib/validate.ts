import { isValidObjectId } from "mongoose";
import { badRequest } from "./errors";

export function assertId(id: unknown, label = "id"): string {
  if (typeof id !== "string" || !isValidObjectId(id)) {
    throw badRequest(`${label} ไม่ถูกต้อง`);
  }
  return id;
}

export function str(v: unknown, label: string, opts: { min?: number; max?: number; optional?: false } = {}): string {
  if (typeof v !== "string" || v.trim().length < (opts.min ?? 1)) {
    throw badRequest(`กรุณากรอก ${label}`);
  }
  const t = v.trim();
  if (opts.max && t.length > opts.max) throw badRequest(`${label} ยาวเกินไป`);
  return t;
}

export function optStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function num(v: unknown, label: string, opts: { min?: number; int?: boolean } = {}): number {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) throw badRequest(`${label} ต้องเป็นตัวเลข`);
  if (opts.int && !Number.isInteger(n)) throw badRequest(`${label} ต้องเป็นจำนวนเต็ม`);
  if (opts.min !== undefined && n < opts.min) throw badRequest(`${label} ต้องไม่น้อยกว่า ${opts.min}`);
  return n;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
