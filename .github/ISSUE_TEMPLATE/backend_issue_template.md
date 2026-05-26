---
name: backend_issue_template
about: This is the template to create an issue
title: '[Backend]  "Nombre del issue"'
labels: ''
assignees: ''

---

# Description
Describe the functionality that must be implemented.

Include:
- Business objective
- Expected behavior
- Technical considerations
- Authentication/authorization requirements if applicable

---

# Endpoint

Example:

GET /payments

---

# Acceptance Criteria

- [ ] Controller implemented
- [ ] Service handles business logic
- [ ] Repository/data access implemented
- [ ] DTOs created and mapped correctly
- [ ] Validations implemented
- [ ] Authentication/authorization handled
- [ ] Proper exception handling added
- [ ] Endpoint documented
- [ ] Unit tests implemented
- [ ] Integration tests implemented (if applicable)

---

# Business Rules

Describe any important business rules.

Example:
- Users cannot apply twice to the same job
- Payments must belong to the authenticated user
- Date ranges must be valid
- Only admins can access this endpoint

---

# API Contract

## Request

GET /payments

---

## Headers

| Header | Required | Description |
|---|---|---|
| Authorization | Yes | Bearer JWT token |
| Content-Type | Yes | application/json |

---

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|
| startDate | string | No | Start date filter |
| endDate | string | No | End date filter |
| page | int | No | Page number |
| pageSize | int | No | Number of items per page |

---

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|
| id | int | No | Resource identifier |

---

## Request Body Example

{
  "amount": 5000,
  "concept": "Salary"
}

---

## Response Body Example

{
  "id": 1,
  "amount": 5000,
  "concept": "Salary",
  "date": "2026-05-21T10:00:00Z"
}

---

# Database Changes

- [ ] No database changes required
- [ ] New migration required
- [ ] New table required
- [ ] Existing table modified
- [ ] Seed data required

## Details

Describe database changes if applicable.

---

# Security Considerations

- [ ] Requires authentication
- [ ] Requires role-based authorization
- [ ] Sensitive data handled
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] Rate limiting required

---

# Error Handling

Describe expected error cases.

Example:
- Invalid input
- Unauthorized access
- Resource not found
- Duplicate records
- Validation failures

---

# Expected Responses

| Status Code | Description |
|---|---|
| 200 OK | Request completed successfully |
| 201 Created | Resource created successfully |
| 400 Bad Request | Invalid request data |
| 401 Unauthorized | User not authenticated |
| 403 Forbidden | User does not have permission |
| 404 Not Found | Resource not found |
| 409 Conflict | Duplicate or conflicting resource |
| 500 Internal Server Error | Unexpected server error |

---

# Dependencies

List related tickets, APIs, services, or database dependencies.

Example:
- Depends on authentication module
- Requires Payments table
- Related to issue #25

---

# Additional Notes

Add any additional implementation details, references, or technical notes.
