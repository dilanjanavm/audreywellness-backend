# Task Management - Filling & Packing Phase Implementation Summary

## Quick Reference for Frontend Team

This document provides a quick summary of the changes and what the frontend team needs to know.

---

## What Changed?

### New Feature
The **Filling & Packing** phase now requires additional customer information when creating tasks:
- Order Number
- Customer Name
- Customer Mobile Number (validated for SMS)
- Customer Address

### Backend Changes
- ✅ New database fields added to `tasks` table
- ✅ Automatic phase detection and validation
- ✅ Mobile number format validation for SMS compatibility
- ✅ Backward compatible with existing tasks

### Frontend Requirements
- ✅ Detect "Filling & Packing" phase
- ✅ Show additional form fields conditionally
- ✅ Validate mobile number format before submission
- ✅ Handle error messages for missing/invalid fields

---

## Implementation Checklist

### 1. Phase Detection
- [ ] Fetch phase list on component mount
- [ ] Identify "Filling & Packing" phase ID
- [ ] Store phase ID for comparison

### 2. Conditional Form Rendering
- [ ] Show standard fields for all phases
- [ ] Show additional fields only when "Filling & Packing" is selected
- [ ] Mark additional fields as required when visible

### 3. Form Validation
- [ ] Validate mobile number format (9-15 digits)
- [ ] Show validation errors before submission
- [ ] Prevent submission if validation fails

### 4. API Integration
- [ ] Include conditional fields in POST /tasks request
- [ ] Handle 400 errors for missing required fields
- [ ] Handle 400 errors for invalid mobile format

### 5. Update Flow
- [ ] Handle moving tasks to Filling & Packing phase
- [ ] Require all fields when phase changes
- [ ] Pre-fill fields if task already has them

---

## Code Snippets

### Detect Phase
```javascript
const phases = await fetch('/tasks/phases').then(r => r.json());
const fillingPackingPhase = phases.data.find(
  p => p.name.toLowerCase() === 'filling & packing'
);
const isFillingAndPacking = selectedPhaseId === fillingPackingPhase?.id;
```

### Conditional Fields
```jsx
{isFillingAndPacking && (
  <>
    <input name="orderNumber" required />
    <input name="customerName" required />
    <input name="customerMobile" required type="tel" />
    <textarea name="customerAddress" required />
  </>
)}
```

### Mobile Validation
```javascript
function isValidMobile(mobile) {
  const cleaned = mobile.trim().replace(/\s+/g, '');
  const digits = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
  return /^\d+$/.test(digits) && digits.length >= 9 && digits.length <= 15;
}
```

---

## API Endpoints

### Create Task
```
POST /tasks
```
- Same endpoint for all phases
- Backend automatically validates based on phaseId

### Get Phases
```
GET /tasks/phases
```
- Returns all phases with their IDs
- Use this to identify Filling & Packing phase

---

## Error Codes & Messages

| Error Code | Message | Solution |
|------------|---------|----------|
| 400 | `orderNumber is required for Filling & Packing phase tasks` | Add orderNumber field |
| 400 | `customerName is required for Filling & Packing phase tasks` | Add customerName field |
| 400 | `customerMobile is required for Filling & Packing phase tasks` | Add customerMobile field |
| 400 | `customerAddress is required for Filling & Packing phase tasks` | Add customerAddress field |
| 400 | `Mobile number must be between 9 and 15 digits` | Check mobile number length |
| 400 | `Mobile number must contain only digits` | Remove non-numeric characters |

---

## Testing Checklist

- [ ] Create task in R&D phase (should work as before)
- [ ] Create task in Blending phase (should work as before)
- [ ] Create task in Filling & Packing phase with all fields (should succeed)
- [ ] Create task in Filling & Packing phase missing one field (should fail)
- [ ] Create task with invalid mobile number (should fail)
- [ ] Update task to Filling & Packing phase (should require all fields)
- [ ] Update task in Filling & Packing phase (should allow partial updates)

---

## Documentation Files

1. **API Documentation**: `docs/TASK_CREATION_API_FILLING_PACKING.md`
   - Complete API reference with examples
   - Request/response formats
   - Error handling

2. **Scenario Documentation**: `docs/TASK_CREATION_SCENARIOS.md`
   - Detailed scenarios and use cases
   - Flow diagrams
   - Frontend implementation recommendations

3. **This Summary**: `docs/TASK_FILLING_PACKING_SUMMARY.md`
   - Quick reference
   - Implementation checklist
   - Code snippets

---

## Questions?

For any questions or clarifications:
1. Review the detailed documentation files
2. Check API examples in the documentation
3. Test with the provided curl examples
4. Contact the backend team if issues persist

---

## Mobile Number Format Reference

### Valid Formats
- ✅ `0771234567` (Sri Lankan local)
- ✅ `+94771234567` (Sri Lankan international)
- ✅ `94771234567` (Sri Lankan international without +)
- ✅ `+12345678901` (US international)
- ✅ `1234567890` (Any valid international)

### Invalid Formats
- ❌ `abc123` (contains letters)
- ❌ `077-123-4567` (contains dashes)
- ❌ `12345` (too short)
- ❌ `12345678901234567` (too long)

---

**Last Updated:** January 2024
**Version:** 1.0
