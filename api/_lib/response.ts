// Consistent response envelope for every Vercel Function in this project. Handlers return
// Response objects directly (Web API style, not the @vercel/node Express-style res.status()
// shim, which crashes at runtime on Vercel's current Node runtime -- see vercel/vercel#16191).

export function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return Response.json(data, { status, headers })
}

export function errorJson(message: string, status = 400, details?: unknown): Response {
  return Response.json({ error: message, ...(details !== undefined ? { details } : {}) }, { status })
}
