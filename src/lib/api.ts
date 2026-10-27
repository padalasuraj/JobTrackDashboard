export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "We couldn’t reach your workspace. Please try again in a moment.",
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      body?.error ||
        body?.message ||
        "Your workspace is waking up. Please try again in a moment.",
      response.status,
    );
  if (!body)
    throw new ApiError(
      "Your workspace is waking up. Please try again in a moment.",
      502,
    );
  return body as T;
}
