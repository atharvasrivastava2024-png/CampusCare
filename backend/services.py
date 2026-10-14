import json
from groq import APIConnectionError, APIError, AuthenticationError, RateLimitError
from pydantic import ValidationError
from schemas import Classification
from llm_utils import client, model
class AIServiceError(Exception):
    """A safe message appropriate for API clients; never includes provider secrets."""
    pass
def _json(prompt):
    try:
        r = client().chat.completions.create(model=model(), messages=[{"role":"system","content":"Return only valid JSON matching the requested schema."},{"role":"user","content":prompt}], response_format={"type":"json_object"}, temperature=0)
        return json.loads(r.choices[0].message.content or "{}")
    except AuthenticationError as exc:
        raise AIServiceError("The AI provider credentials are invalid or expired. Ask an administrator to update GROQ_API_KEY.") from exc
    except (APIConnectionError, APIError, RateLimitError, json.JSONDecodeError) as exc:
        raise AIServiceError("The AI provider is unavailable or returned an invalid response. Please retry.") from exc
def classify(description, clarification=None, hint=None):
    try:
        return Classification.model_validate(_json(f"""Classify a college complaint. Categories only: Library, Student Welfare, Hostel, Proctor, Gym, Food & Mess. Urgency only Low, Medium, High. Do not provide hidden reasoning: classification_reason is a concise user-safe explanation. If ambiguous return null category and urgency, needs_clarification true and one question. JSON keys category, subcategory, urgency, classification_reason, needs_clarification, clarification_question. Complaint: {description}\nClarification: {clarification or ''}\nHint: {hint or ''}"""))
    except ValidationError as exc:
        raise AIServiceError("The AI provider returned an invalid classification. Please retry.") from exc
def generate_letter(description, category, subcategory, urgency, student_name, recipient_name="College Authority"):
    data = _json(f"""Draft a concise formal student complaint letter. Preserve supplied facts only; do not invent dates, incidents, witnesses, policies, or violations. Begin with a formal salutation to {recipient_name}, request appropriate investigation or corrective action, and close professionally. JSON keys: subject, body. Student: {student_name or 'Student'}. Category: {category}; subcategory: {subcategory or 'Not specified'}; urgency suggestion: {urgency}. Complaint: {description}""")
    if not isinstance(data.get("subject"), str) or not isinstance(data.get("body"), str): raise AIServiceError("The AI provider returned an incomplete letter draft. Please retry.")
    return data
def letter(description, category, subcategory, urgency, student_name, authority_name, authority_email):
    data = generate_letter(description, category, subcategory, urgency, student_name, authority_name)
    # The LLM never decides routing: recipient identity always comes from the
    # trusted authority mapping supplied by the caller.
    data["recipient_name"], data["recipient_email"] = authority_name, authority_email
    return data
