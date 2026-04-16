export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(m = 'Not found') {
    super(404, m, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(m = 'Unauthorized') {
    super(401, m, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends AppError {
  constructor(m = 'Bad request') {
    super(400, m, 'BAD_REQUEST');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(m = 'Rate limited') {
    super(429, m, 'RATE_LIMITED');
  }
}
