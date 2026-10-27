package com.jobtrack;

import org.springframework.http.HttpStatus;

class ApiException extends RuntimeException {
    final HttpStatus status;
    ApiException(HttpStatus status, String message) { super(message); this.status = status; }
    static ApiException unauthorized() { return new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."); }
    static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "Application not found."); }
}
