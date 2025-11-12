from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import json

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
EXTERNAL_API_URL = "https://academy.beyond-search.uat.udi.beyond.ai/api/sessions/texts"

AUTHORIZATION_TOKEN = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJFbHpTUlpZblIwcjA5UWhDUnltcVZsb3M0c2dYSXhfRGxUWEEwdHpyQ0JvIn0.eyJleHAiOjE3NjI5MDQxNDAsImlhdCI6MTc2MjkwMzg0MCwianRpIjoiZmEzMDdkOTItZjk5My00YzA2LTg0ZTktZWRhZGEzNjBlYThjIiwiaXNzIjoiaHR0cHM6Ly9rYy1icy51ZGkuYmV5b25kLmFpL3JlYWxtcy9hY2FkZW15Iiwic3ViIjoiNWU3MTljZDEtMmVmMi00YmZmLWI2YjktNzEwN2RlOTJmZDg4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiMTZNeGpoeTgxd1l5eTNsM2ZpR3RYcnJ1eURjSCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiQmFzaWMiLCJUZW5hbnQgQWRtaW5pc3RyYXRvciIsIlJlcG9zaXRvcnkgTWFuYWdlciIsIkRldmVsb3BlciJdfSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiY2xpZW50SG9zdCI6IjcyLjEwLjgzLjE1NCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6IkdlblBhY3RfVGVhbTIgJ0FQSSBLZXknIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTE2bXhqaHk4MXd5eXkzbDNmaWd0eHJydXlkY2giLCJnaXZlbl9uYW1lIjoiR2VuUGFjdF9UZWFtMiIsImNsaWVudEFkZHJlc3MiOiI3Mi4xMC44My4xNTQiLCJmYW1pbHlfbmFtZSI6IidBUEkgS2V5JyIsImNsaWVudF9pZCI6IjE2TXhqaHk4MXdZeXkzbDNmaUd0WHJydXlEY0gifQ.P-_C2xO3Mm5ZppjKh4Sjc0BaeERy9HOGdQtt_rN5zdM6qGzQoD-3-81N2bPcpQ-atqxlF29bDQVbwoQRtL-y1tnIf1l_kU1e4wKncCzzb44-kDwkW1Eyjc8UdniCMFSyV9ywN8FjbSVExxgRD_HPBPfRJlEKTzbxIBfEilXedTlHW099sfpxV85SPCHxG2HWza_vpG6aZ3phob8RPcHx0U9dtDwXw0AyRwGWEcRw9-Nm7mgmWIpArdy5Hq8S19UvUOlUxyK6MikMLx-oUnBsWQR98PgJc9iQ2C-XU79Of13k0Qh6EmubP_8NDrCyuvtIEmOXOaeeoZICe9JSMUfNkQ'

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
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': AUTHORIZATION_TOKEN
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
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': AUTHORIZATION_TOKEN
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
