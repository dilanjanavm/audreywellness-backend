# SMS Gateway API - Quick Reference

## Base URL
All endpoints: `/sms`

## Authentication
All endpoints require: `Authorization: Bearer <JWT_TOKEN>`

---

## Endpoint Summary

### SMS Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sms/send` | Send SMS message |
| `GET` | `/sms/messages/:uid` | View specific SMS |
| `GET` | `/sms/messages` | View all SMS messages |

### Contact Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sms/contact-groups` | Create group |
| `GET` | `/sms/contact-groups` | List all groups |
| `GET` | `/sms/contact-groups/:group_id` | View group |
| `PATCH` | `/sms/contact-groups/:group_id` | Update group |
| `DELETE` | `/sms/contact-groups/:group_id` | Delete group |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sms/contact-groups/:group_id/contacts` | Create contact |
| `GET` | `/sms/contact-groups/:group_id/contacts` | List contacts in group |
| `GET` | `/sms/contact-groups/:group_id/contacts/:uid` | View contact |
| `PATCH` | `/sms/contact-groups/:group_id/contacts/:uid` | Update contact |
| `DELETE` | `/sms/contact-groups/:group_id/contacts/:uid` | Delete contact |

### Profile & Balance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sms/balance` | Check SMS balance |
| `GET` | `/sms/profile` | View account profile |

---

## Request/Response Examples

### Send SMS
**Request:**
```json
POST /sms/send
{
  "recipient": "31612345678",
  "sender_id": "AudreyWellness",
  "message": "Hello from Audrey Wellness!"
}
```

**Response:**
```json
{
  "status": "success",
  "data": { /* SMS details */ }
}
```

### Create Contact Group
**Request:**
```json
POST /sms/contact-groups
{
  "name": "Customers"
}
```

### Create Contact
**Request:**
```json
POST /sms/contact-groups/{group_id}/contacts
{
  "phone": 31612345678,
  "first_name": "John",
  "last_name": "Doe"
}
```

### Check Balance
**Request:**
```
GET /sms/balance
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "balance": 1000,
    "unit": "SMS"
  }
}
```

---

## Environment Setup

Add to `.env.development` or `.env`:
```env
SENDLK_API_TOKEN=your-token-here
```

See `docs/SMS_API_DOCUMENTATION.md` for complete documentation.
