from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
import time
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Request model for contract generation
class SupplyAgreementRequest(BaseModel):
    supplier_name: str
    product: str
    annual_volume: str
    delivery: str
    pricing: str
    payment_terms: str
    contract_duration: str
    quality_standards: str
    warranty: str
    compliance: str
    risk_requirements: str
    additional_clauses: str
    index_name: Optional[List[str]] = ["1762885457669_uat_contracts"]

# Request model for general queries (keeping for backward compatibility)
class QuestionRequest(BaseModel):
    question_body: str
    index_name: Optional[List[str]] = ["1762885457669_uat_contracts"]

# External API configuration
EXTERNAL_API_URL = os.getenv("EXTERNAL_API_URL")

# OAuth2 token endpoint configuration
TOKEN_URL = os.getenv("TOKEN_URL")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

# Validate that environment variables are set
if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("CLIENT_ID and CLIENT_SECRET must be set in environment variables or .env file")
if not EXTERNAL_API_URL or not TOKEN_URL:
    raise ValueError("EXTERNAL_API_URL and TOKEN_URL must be set in environment variables or .env file")

# Token cache
_token_cache = {
    "access_token": None,
    "expires_at": 0
}

def get_access_token() -> str:
    """
    Fetches an OAuth2 access token using client credentials flow.
    Caches the token until it expires.
    """
    global _token_cache
    
    # Check if cached token is still valid (with 60 second buffer)
    current_time = time.time()
    if _token_cache["access_token"] and current_time < (_token_cache["expires_at"] - 60):
        return f'Bearer {_token_cache["access_token"]}'
    
    # Fetch new token
    try:
        token_data = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
        
        response = requests.post(
            TOKEN_URL,
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        response.raise_for_status()
        token_response = response.json()
        
        access_token = token_response["access_token"]
        expires_in = token_response.get("expires_in", 3600)  # Default to 1 hour if not provided
        
        # Cache the token
        _token_cache["access_token"] = access_token
        _token_cache["expires_at"] = current_time + expires_in
        
        return f'Bearer {access_token}'
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to obtain access token: {str(e)}"
        )
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid token response: missing {str(e)}"
        )

def construct_contract_prompt(request: SupplyAgreementRequest) -> str:
    """
    Constructs a comprehensive prompt for generating a Supply Agreement Contract.
    """
    prompt = f"""I need a Supply Agreement Contract. Here are the details:

Supplier Name: {request.supplier_name}

Product: {request.product}

Annual Volume: {request.annual_volume}

Delivery: {request.delivery}

Pricing: {request.pricing}

Payment Terms: {request.payment_terms}

Contract Duration: {request.contract_duration}

Quality Standards: {request.quality_standards}

Warranty: {request.warranty}

Compliance: {request.compliance}

Risk Requirements: {request.risk_requirements}

Additional Clauses: {request.additional_clauses}

Please generate the full Supply Agreement Contract and then provide a compliance check summary."""
    
    return prompt

@app.post("/generate-contract")
async def generate_contract(request: SupplyAgreementRequest):
    """
    Endpoint that accepts contract details and generates a Supply Agreement Contract via LLM API.
    """
    try:
        # Construct the prompt from contract details
        prompt = construct_contract_prompt(request)
        
        # Prepare payload
        payload = {
            "question_body": prompt,
            "index_name": request.index_name
        }
        
        # Get access token
        auth_token = get_access_token()
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': auth_token
        }
        
        # Make request to external API
        response = requests.post(
            EXTERNAL_API_URL,
            headers=headers,
            json=payload
        )
        
        # Check if request was successful
        response.raise_for_status()
        
        json_response = json.loads(response.text)
        answer_body = json_response["data"]["answer_body"]
        return {"llm_response": answer_body}
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/query")
async def query(request: QuestionRequest):
    """
    Endpoint that accepts a question_body and forwards it to the external API.
    """
    try:
        # Prepare payload
        payload = {
            "question_body": request.question_body,
            "index_name": request.index_name
        }
        
        # Get access token
        auth_token = get_access_token()
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': auth_token
        }
        
        # Make request to external API
        response = requests.post(
            EXTERNAL_API_URL,
            headers=headers,
            json=payload
        )
        
        # Check if request was successful
        response.raise_for_status()
        
        json_response = json.loads(response.text)
        answer_body = json_response["data"]["answer_body"]
        return {"llm_response": answer_body}
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "FastAPI backend for question queries"}
