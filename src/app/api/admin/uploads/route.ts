import { getAdmin, isSameOrigin } from "@/lib/auth/admin";
import { createUploadTarget, planUpload, UploadRejected } from "@/lib/media/storage";
import { uploadRequestSchema } from "@/lib/validation";

/**
 * Step 1 of an upload: an admin asks to upload a file of a given type and size.
 * The server validates the request and returns a one-time upload target. The file
 * then goes straight to storage (Supabase signed upload URL, or the local PUT route).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!(await getAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });
  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid upload request" }, { status: 400 });
  try {
    const { path, maxBytes } = planUpload(parsed.data.kind, parsed.data.contentType, parsed.data.size);
    return Response.json(await createUploadTarget(path, parsed.data.contentType.toLowerCase(), maxBytes));
  } catch (err) {
    if (err instanceof UploadRejected) return Response.json({ error: err.message }, { status: 400 });
    console.error("upload target failed", err);
    return Response.json({ error: "Could not start the upload" }, { status: 500 });
  }
}
