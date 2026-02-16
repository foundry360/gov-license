"""
License Validation Module (Python)
Use this in your deployed VPC software to validate license keys

Installation:
    pip install PyJWT cryptography

Usage:
    from validate_license import validate_license
    
    result = validate_license(license_key, secret_key)
    if result['valid']:
        print('License is valid!')
        print('Customer:', result['customer_id'])
        print('Features:', result['features'])
    else:
        print('License invalid:', result['error'])
"""

import jwt
import json
from datetime import datetime
from typing import Dict, Any, Optional


def validate_license(license_key: str, secret_key: str) -> Dict[str, Any]:
    """
    Validates a license key
    
    Args:
        license_key: The JWT license key to validate
        secret_key: The secret key used to sign the license (same as JWT_SECRET)
    
    Returns:
        Dictionary with validation result containing:
        - valid: bool indicating if license is valid
        - error: str error message if invalid
        - customer_id: str customer ID if valid
        - expires_at: str expiration date if valid
        - features: list of enabled features if valid
        - days_remaining: int days until expiration if valid
    """
    if not license_key or not isinstance(license_key, str):
        return {
            'valid': False,
            'error': 'License key is required and must be a string',
        }
    
    if not secret_key or not isinstance(secret_key, str):
        return {
            'valid': False,
            'error': 'Secret key is required for validation',
        }
    
    try:
        # Verify and decode the JWT token
        decoded = jwt.decode(
            license_key,
            secret_key,
            algorithms=['HS256'],
            options={'verify_exp': True}
        )
        
        # Check if required fields exist
        if 'customer_id' not in decoded or 'expires_at' not in decoded:
            return {
                'valid': False,
                'error': 'License key is missing required fields',
            }
        
        # Check expiration (JWT already checks this, but double-check for safety)
        expires_at = datetime.fromisoformat(decoded['expires_at'].replace('Z', '+00:00'))
        now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.now()
        
        if expires_at <= now:
            return {
                'valid': False,
                'error': 'License has expired',
                'customer_id': decoded.get('customer_id'),
                'expires_at': decoded.get('expires_at'),
                'features': decoded.get('features', []),
            }
        
        # Calculate days remaining
        days_remaining = (expires_at - now).days
        
        # License is valid
        return {
            'valid': True,
            'customer_id': decoded['customer_id'],
            'expires_at': decoded['expires_at'],
            'issued_at': decoded.get('issued_at'),
            'features': decoded.get('features', []),
            'days_remaining': days_remaining,
        }
    
    except jwt.ExpiredSignatureError:
        return {
            'valid': False,
            'error': 'License has expired',
        }
    except jwt.InvalidTokenError as e:
        return {
            'valid': False,
            'error': f'Invalid license key signature: {str(e)}',
        }
    except Exception as e:
        return {
            'valid': False,
            'error': f'License validation error: {str(e)}',
        }


def validate_license_from_file(file_path: str, secret_key: str) -> Dict[str, Any]:
    """
    Validates a license key from a file
    
    Args:
        file_path: Path to the license file
        secret_key: The secret key used to sign the license
    
    Returns:
        Dictionary with validation result
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            license_key = f.read().strip()
        return validate_license(license_key, secret_key)
    except FileNotFoundError:
        return {
            'valid': False,
            'error': f'License file not found: {file_path}',
        }
    except Exception as e:
        return {
            'valid': False,
            'error': f'Failed to read license file: {str(e)}',
        }


# Example usage (commented out)
"""
if __name__ == '__main__':
    import os
    
    # Example 1: Validate from string
    license_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    secret_key = os.getenv('LICENSE_SECRET_KEY')
    
    result = validate_license(license_key, secret_key)
    if result['valid']:
        print('✅ License is valid!')
        print('Customer ID:', result['customer_id'])
        print('Features:', result['features'])
        print('Days remaining:', result['days_remaining'])
    else:
        print('❌ License invalid:', result['error'])
    
    # Example 2: Validate from file
    file_result = validate_license_from_file('./license.txt', secret_key)
    if file_result['valid']:
        print('License loaded and validated successfully')
    else:
        print('License validation failed:', file_result['error'])
"""

