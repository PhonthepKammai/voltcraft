import type { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { badRequest } from "@/lib/errors";
import {
  isUploadScope,
  UPLOAD_SCOPES,
  uploadService,
} from "@/services/upload.service";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const formData = await req.formData();
  const rawScope = formData.get("scope") ?? "products";

  if (!isUploadScope(rawScope)) {
    throw badRequest("ประเภทการอัปโหลดไม่ถูกต้อง (ต้องเป็น products หรือ reviews)");
  }

  // ตรวจสิทธิ์ตาม scope: สินค้าใช้ admin, รีวิวใช้ user ที่ล็อกอินแล้ว
  const config = UPLOAD_SCOPES[rawScope];
  const actor = config.requireAdmin
    ? await requireAdmin(req)
    : await requireUser(req);

  // รองรับทั้ง key ชื่อ "files" (หลายรูป) และ "file" (รูปเดียว)
  const rawEntries = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ];
  const files = rawEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  const uploaded = await uploadService.uploadImages(files, rawScope, actor.id);

  return created(
    {
      files: uploaded,
      urls: uploaded.map((item) => item.url),
    },
    `อัปโหลดรูปภาพเรียบร้อยแล้ว (${uploaded.length} รูป)`
  );
});

export const DELETE = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await readJson<{ url?: unknown }>(req);
  await uploadService.deleteImage(body.url);

  return ok({ deleted: true }, "ลบรูปภาพเรียบร้อยแล้ว");
});