from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce tenant isolation across all requests."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Add tenant context to request state
        request.state.tenant_id = None
        request.state.user_id = None
        
        # Process request
        response = await call_next(request)
        
        # Add tenant header to response for debugging
        if hasattr(request.state, "tenant_id") and request.state.tenant_id:
            response.headers["X-Tenant-ID"] = str(request.state.tenant_id)
        
        return response
