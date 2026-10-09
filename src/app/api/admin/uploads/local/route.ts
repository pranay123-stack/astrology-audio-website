import { getAdmin, isSameOrigin } from "@/lib/auth/admin";
import { verifyToken } from "@/lib/auth/tokens";
import { getDataBackend } from "@/lib/config";
import { UploadRejected, writeLocalUpload } from "@/lib/media/storage";

/** Step 2 of an upload in local mode: receives the file body for a signed upload token. */
export async function PUT(request: Request) {
  if (getDataBackend() !== "local") return Response.json({ error: "Not found" }, { status: 404 });
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!(await getAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });

  const token = new URL(request.url).searchParams.get("token");
  const claim = verifyToken<{ path: string; ct: string; max: number; purpose: string }>(token);
  if (!claim || claim.purpose !== "upload") return Response.json({ error: "Upload link expired" }, { status: 403 });
  if ((request.headers.get("content-type") ?? "").toLowerCase() !== claim.ct) {
    return Response.json({ error: "Content type does not match the upload request" }, { status: 400 });
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > claim.max) return Response.json({ error: "File exceeds the upload size limit" }, { status: 413 });
  if (!request.body) return Response.json({ error: "Empty upload" }, { status: 400 });

  try {
    const size = await writeLocalUpload(claim.path, request.body, claim.max);
    return Response.json({ path: claim.path, size });
  } catch (err) {
    if (err instanceof UploadRejected) return Response.json({ error: err.message }, { status: 400 });
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return Response.json({ error: "Upload already used" }, { status: 409 });
    console.error("local upload failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
