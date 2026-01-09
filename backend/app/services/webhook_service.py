"""
Webhook Service - Handles outgoing webhook calls
"""

import aiohttp
import asyncio
import hmac
import hashlib
import json
import time
from typing import Dict, Any, List, Optional
import structlog

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.webhook import webhook_repository

logger = structlog.get_logger()


class WebhookService:
    """Service for sending outgoing webhook notifications."""
    
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def trigger_event(
        self,
        db: AsyncSession,
        workflow_id: int,
        event: str,
        data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Trigger webhooks for a specific event.
        Returns list of results for each webhook call.
        """
        # Get webhooks configured for this event
        webhooks = await webhook_repository.get_webhooks_for_event(db, workflow_id, event)
        
        if not webhooks:
            return []
        
        results = []
        for webhook in webhooks:
            result = await self._send_webhook(db, webhook, event, data)
            results.append(result)
        
        return results
    
    async def _send_webhook(
        self,
        db: AsyncSession,
        webhook,
        event: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send a single webhook notification."""
        
        if not webhook.url:
            return {"webhook_id": webhook.id, "success": False, "error": "No URL configured"}
        
        # Build payload
        payload = {
            "event": event,
            "webhook_id": webhook.uuid,
            "workflow_id": webhook.workflow_id,
            "timestamp": time.time(),
            "data": data
        }
        
        # Build headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Askyia-Webhook/1.0",
            "X-Askyia-Event": event,
            **(webhook.headers or {})
        }
        
        # Add signature if secret is configured
        if webhook.secret:
            payload_bytes = json.dumps(payload).encode()
            signature = hmac.new(
                webhook.secret.encode(),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()
            headers["X-Askyia-Signature"] = signature
        
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook.url,
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                ) as response:
                    response_time = int((time.time() - start_time) * 1000)
                    response_body = await response.text()
                    
                    success = 200 <= response.status < 300
                    
                    # Log the call
                    await webhook_repository.log_call(
                        db,
                        webhook.id,
                        event=event,
                        method="POST",
                        request_headers=headers,
                        request_body=json.dumps(payload),
                        response_status=response.status,
                        response_body=response_body[:1000],
                        response_time_ms=response_time,
                        success=success
                    )
                    
                    # Update stats
                    await webhook_repository.update_stats(db, webhook.id, success)
                    
                    logger.info(
                        "webhook_sent",
                        webhook_id=webhook.id,
                        event=event,
                        status=response.status,
                        success=success,
                        response_time_ms=response_time
                    )
                    
                    return {
                        "webhook_id": webhook.id,
                        "success": success,
                        "status_code": response.status,
                        "response_time_ms": response_time
                    }
                    
        except asyncio.TimeoutError:
            response_time = int((time.time() - start_time) * 1000)
            
            await webhook_repository.log_call(
                db,
                webhook.id,
                event=event,
                method="POST",
                request_body=json.dumps(payload),
                response_time_ms=response_time,
                success=False,
                error_message="Request timeout"
            )
            
            await webhook_repository.update_stats(db, webhook.id, False)
            
            logger.warning("webhook_timeout", webhook_id=webhook.id, event=event)
            
            return {
                "webhook_id": webhook.id,
                "success": False,
                "error": "Request timeout",
                "response_time_ms": response_time
            }
            
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            
            await webhook_repository.log_call(
                db,
                webhook.id,
                event=event,
                method="POST",
                request_body=json.dumps(payload),
                response_time_ms=response_time,
                success=False,
                error_message=str(e)
            )
            
            await webhook_repository.update_stats(db, webhook.id, False)
            
            logger.error("webhook_error", webhook_id=webhook.id, event=event, error=str(e))
            
            return {
                "webhook_id": webhook.id,
                "success": False,
                "error": str(e),
                "response_time_ms": response_time
            }


# Singleton
webhook_service = WebhookService()