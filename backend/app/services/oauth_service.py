# backend/app/services/oauth_service.py
from typing import Optional, Tuple
import httpx
from dataclasses import dataclass
from app.core.config import get_settings

settings = get_settings()


@dataclass
class OAuthUserInfo:
    """Standardized OAuth user info."""
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    oauth_id: str
    provider: str


class OAuthService:
    """Handle OAuth authentication for multiple providers."""
    
    # Google OAuth endpoints
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    # GitHub OAuth endpoints
    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
    GITHUB_USERINFO_URL = "https://api.github.com/user"
    GITHUB_EMAILS_URL = "https://api.github.com/user/emails"
    
    def __init__(self):
        self.google_client_id = settings.google_client_id
        self.google_client_secret = settings.google_client_secret
        self.github_client_id = settings.github_client_id
        self.github_client_secret = settings.github_client_secret
        self.oauth_redirect_uri = settings.oauth_redirect_uri
    
    def get_google_auth_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""
        params = {
            "client_id": self.google_client_id,
            "redirect_uri": f"{self.oauth_redirect_uri}/google",
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GOOGLE_AUTH_URL}?{query}"
    
    def get_github_auth_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            "client_id": self.github_client_id,
            "redirect_uri": f"{self.oauth_redirect_uri}/github",
            "scope": "user:email read:user",
            "state": state
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GITHUB_AUTH_URL}?{query}"
    
    async def exchange_google_code(self, code: str) -> Optional[OAuthUserInfo]:
        """Exchange Google auth code for user info."""
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            token_response = await client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{self.oauth_redirect_uri}/google"
                }
            )
            
            if token_response.status_code != 200:
                return None
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                return None
            
            # Get user info
            userinfo_response = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                return None
            
            user_data = userinfo_response.json()
            
            return OAuthUserInfo(
                email=user_data.get("email"),
                name=user_data.get("name"),
                avatar_url=user_data.get("picture"),
                oauth_id=user_data.get("id"),
                provider="google"
            )
    
    async def exchange_github_code(self, code: str) -> Optional[OAuthUserInfo]:
        """Exchange GitHub auth code for user info."""
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            token_response = await client.post(
                self.GITHUB_TOKEN_URL,
                data={
                    "client_id": self.github_client_id,
                    "client_secret": self.github_client_secret,
                    "code": code,
                    "redirect_uri": f"{self.oauth_redirect_uri}/github"
                },
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                return None
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                return None
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
            
            # Get user info
            userinfo_response = await client.get(
                self.GITHUB_USERINFO_URL,
                headers=headers
            )
            
            if userinfo_response.status_code != 200:
                return None
            
            user_data = userinfo_response.json()
            
            # Get primary email (might be private)
            email = user_data.get("email")
            if not email:
                emails_response = await client.get(
                    self.GITHUB_EMAILS_URL,
                    headers=headers
                )
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next(
                        (e for e in emails if e.get("primary")), 
                        emails[0] if emails else None
                    )
                    if primary_email:
                        email = primary_email.get("email")
            
            if not email:
                return None
            
            return OAuthUserInfo(
                email=email,
                name=user_data.get("name") or user_data.get("login"),
                avatar_url=user_data.get("avatar_url"),
                oauth_id=str(user_data.get("id")),
                provider="github"
            )


oauth_service = OAuthService()