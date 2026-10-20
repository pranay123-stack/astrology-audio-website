import { notFound } from "next/navigation";

// This route only ever renders the 404 page, so there is no instant shell to validate.
export const instant = false;

/** Unknown addresses inside a language get that language's 404 page (with header and footer). */
export default function UnknownPage() {
  notFound();
}
