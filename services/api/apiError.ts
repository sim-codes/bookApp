interface ProblemDetails {
    title?: string;
    status?: number;
    code?: string;
    errors?: Record<string, string[]>;
}

/** A failed API call. `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
        readonly code?: string,
        readonly fieldErrors?: Record<string, string[]>,
    ) {
        super(message);
        this.name = 'ApiError';
    }

    static network(cause?: unknown): ApiError {
        const error = new ApiError(0, 'Could not reach the server. Check your connection.');
        (error as { cause?: unknown }).cause = cause;
        return error;
    }

    static async fromResponse(response: Response): Promise<ApiError> {
        let problem: ProblemDetails = {};
        try {
            problem = (await response.json()) as ProblemDetails;
        } catch {
            // Not every failure has a JSON body.
        }
        return new ApiError(response.status, problem.title ?? `Request failed (${response.status})`, problem.code, problem.errors);
    }

    get isNetwork(): boolean {
        return this.status === 0;
    }

    /** Worth trying again later: offline, rate limited, a concurrent change, or a server fault. */
    get isRetryable(): boolean {
        return this.status === 0 || this.status === 408 || this.status === 409 || this.status === 429 || this.status >= 500;
    }
}
