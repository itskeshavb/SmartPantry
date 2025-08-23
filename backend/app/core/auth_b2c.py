from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
import requests
import json
import logging
from datetime import datetime, timedelta
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)
security = HTTPBearer()

class AzureADB2CAuth:
    def __init__(self):
        self.tenant_name = settings.azure_b2c_tenant_name
        self.client_id = settings.azure_b2c_client_id
        self.policy_name = settings.azure_b2c_policy_name
        self.issuer = f"https://{self.tenant_name}.b2clogin.com/{self.tenant_name}.onmicrosoft.com/{self.policy_name}/v2.0/"
        self.jwks_url = f"https://{self.tenant_name}.b2clogin.com/{self.tenant_name}.onmicrosoft.com/{self.policy_name}/discovery/v2.0/keys"
        self._jwks = None

    async def get_jwks(self):
        """Get JSON Web Key Set from Azure AD B2C"""
        if self._jwks is None:
            try:
                response = requests.get(self.jwks_url)
                response.raise_for_status()
                self._jwks = response.json()
            except Exception as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication service unavailable"
                )
        return self._jwks

    def verify_token(self, token: str) -> dict:
        """Verify JWT token from Azure AD B2C"""
        try:
            # Decode token without verification first to get header
            unverified_header = jwt.get_unverified_header(token)
            
            # Get JWKS
            jwks = self.get_jwks()
            
            # Find the correct key
            key = None
            for jwk in jwks.get('keys', []):
                if jwk.get('kid') == unverified_header.get('kid'):
                    key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                    break
            
            if not key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            # Verify and decode token
            payload = jwt.decode(
                token,
                key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=self.issuer,
                options={
                    'verify_signature': True,
                    'verify_aud': True,
                    'verify_iss': True,
                    'verify_exp': True
                }
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed"
            )

    def get_user_from_token(self, payload: dict) -> User:
        """Extract user information from token payload"""
        try:
            # Extract user information from B2C token
            user_id = payload.get('sub') or payload.get('oid')
            email = payload.get('emails', [None])[0] if payload.get('emails') else payload.get('email')
            name = payload.get('name') or payload.get('given_name', '') + ' ' + payload.get('family_name', '')
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            return User(
                id=user_id,
                email=email or f"{user_id}@b2c.local",
                name=name.strip() or "B2C User",
                householdId=None,
                preferences={
                    "notificationDays": 3,
                    "theme": "dark",
                    "units": "imperial"
                }
            )
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

# Initialize Azure AD B2C auth
b2c_auth = AzureADB2CAuth()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from Azure AD B2C token"""
    try:
        token = credentials.credentials
        payload = b2c_auth.verify_token(token)
        user = b2c_auth.get_user_from_token(payload)
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current user if token is provided, otherwise return None"""
    try:
        if not credentials:
            return None
        return await get_current_user(credentials)
    except HTTPException:
        return None
