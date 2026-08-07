const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      message?: string;
      fieldErrors?: Record<string, string>;
    };
    return new ApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.fieldErrors ?? {},
    );
  } catch {
    return new ApiError(`Request failed with status ${response.status}`, response.status);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getApiUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_URL}${path}`;
}
