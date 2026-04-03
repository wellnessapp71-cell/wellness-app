import { errorResponse } from "@/lib/api/response";
import { resolveAuthContext } from "@/lib/auth/middleware";

export function requireRole(request: Request, roles: string[]) {
  const auth = resolveAuthContext(request);
  if (!auth) {
    return { auth: null, response: errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.") };
  }

  if (!roles.includes(auth.role)) {
    return {
      auth: null,
      response: errorResponse(403, "FORBIDDEN", "You do not have access to this resource."),
    };
  }

  return { auth, response: null };
}
