export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: any;
    };
}

export class ApiError extends Error {
    constructor(
        public message: string,
        public code: string = 'INTERNAL_SERVER_ERROR',
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function createSuccessResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
        success: true,
        message,
        data
    };
}

export function createErrorResponse(error: ApiError): ApiResponse<null> {
    return {
        success: false,
        message: error.message,
        error: {
            code: error.code,
            details: error.details
        }
    };
}