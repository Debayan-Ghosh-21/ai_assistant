class DyslexxyError(Exception):
    """Base exception class for Dyslexxy errors."""

    pass


class DatabaseOperationError(DyslexxyError):
    """Raised when a database operation fails."""

    pass


class UnsupportedTypeException(DyslexxyError):
    """Raised when an unsupported type is provided."""

    pass


class InvalidInputError(DyslexxyError):
    """Raised when invalid input is provided."""

    pass


class NotFoundError(DyslexxyError):
    """Raised when a requested resource is not found."""

    pass


class AuthenticationError(DyslexxyError):
    """Raised when there's an authentication problem."""

    pass


class ConfigurationError(DyslexxyError):
    """Raised when there's a configuration problem."""

    pass


class ExternalServiceError(DyslexxyError):
    """Raised when an external service (e.g., AI model) fails."""

    pass


class RateLimitError(DyslexxyError):
    """Raised when a rate limit is exceeded."""

    pass


class FileOperationError(DyslexxyError):
    """Raised when a file operation fails."""

    pass


class NetworkError(DyslexxyError):
    """Raised when a network operation fails."""

    pass


class NoTranscriptFound(DyslexxyError):
    """Raised when no transcript is found for a video."""

    pass
