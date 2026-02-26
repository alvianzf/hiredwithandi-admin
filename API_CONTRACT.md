# API Contract

## 1. Job Tracker Schema (Frontend `hwa_jobs`)

The primary state for job applications is stored as a serialized JSON object containing columns for the Kanban board and the dictionary of jobs.

### `Job` Object

```json
{
  "id": "string (unique identifier)",
  "company": "string",
  "position": "string",
  "url": "string (optional job posting URL)",
  "salary": "string (optional monthly salary range)",
  "notes": "string (optional)",
  "workType": "string (enum: 'remote', 'onsite', 'hybrid')",
  "location": "string (optional)",
  "finalOffer": "string (optional, populated when in 'offered' status)",
  "benefits": "string (optional, populated when in 'offered' status)",
  "nonMonetaryBenefits": "string (optional, populated when in 'offered' status)",
  "jobFitPercentage": "number (0-100)",
  "dateApplied": "string (ISO 8601 Date)",
  "dateAdded": "string (ISO 8601 Date)",
  "status": "string (enum matching column IDs)",
  "statusChangedAt": "string (ISO 8601 Date)",
  "history": [
    {
      "status": "string (enum matching column IDs)",
      "enteredAt": "string (ISO 8601 Date)",
      "leftAt": "string (ISO 8601 Date) | null"
    }
  ]
}
```

### Main Jobs State (`JobContext`)

```json
{
  "jobs": {
    "job_id_1": {
      /* Job Object */
    },
    "job_id_2": {
      /* Job Object */
    }
  },
  "columns": {
    "wishlist": ["job_id_1"],
    "applied": ["job_id_2"],
    "hr_interview": [],
    "technical_interview": [],
    "additional_interview": [],
    "offered": [],
    "rejected_company": [],
    "rejected_applicant": []
  }
}
```

---

## 2. Authentication Schema (`hwa_auth`)

Stores basic identity information.

```json
{
  "name": "string",
  "email": "string",
  "createdAt": "string (ISO 8601 Date)"
}
```

---

## 3. User Profile Schema (`hwa_profile`)

Stores the extended user profile including the base64 encoded avatar.

```json
{
  "name": "string",
  "email": "string",
  "bio": "string",
  "role": "string",
  "organization": "string",
  "location": "string",
  "linkedIn": "string (URL)",
  "avatarUrl": "string (Base64 Data URL) | null"
}
```

---

## 4. Admin Portal Storage (Admin Context)

### `Organization` (Stored in `hwa_organizations`)

```json
{
  "id": "string (e.g., org_123456)",
  "name": "string"
}
```

### `Admin & Superadmin User` (Stored in `hwa_admins` & `hwa_superadmins`)

```json
{
  "id": "string",
  "orgId": "string (or 'sys' for Superadmins)",
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "string (enum: 'admin', 'superadmin')"
}
```

### `Student User` (Stored in `hwa_students`)

```json
{
  "id": "string",
  "orgId": "string (maps to hwa_organizations)",
  "name": "string",
  "email": "string",
  "status": "string (enum: 'Active', 'Disabled')"
}
```
