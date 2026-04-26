# Data Export/Import/Reset Feature Implementation Plan

## Overview
Add data management features to the Settings page allowing users to:
1. **Export** all user data as a structured JSON file
2. **Reset** (delete) all user data with two-step confirmation
3. **Import** previously exported JSON data

This enables data portability between local development environments.

---

## Data Scope

**Entities to include:**
- Categories (custom user-created ones)
- Bill Templates
- Pay Periods (with nested bills and spending entries)

**Export JSON Structure:**
```json
{
  "export_version": "1.0",
  "export_date": "2026-04-05T10:00:00Z",
  "data": {
    "categories": [...],
    "bill_templates": [...],
    "pay_periods": [
      {
        "start_date": "2026-04-06",
        "end_date": "2026-04-19",
        "expected_income": "2500.00",
        "actual_income": null,
        "notes": null,
        "bills": [...],
        "spending_entries": [...]
      }
    ]
  }
}
```

**Note:** IDs are excluded from export (regenerated on import). Foreign key references (category_id, bill_template_id) will be re-mapped by name matching during import.

---

## Implementation Steps

### Step 1: Backend - Data Management Routes

**New file:** `backend/app/routes/data_management.py`

```python
# Blueprint: data_management_bp, url_prefix="/api"

# GET /api/data/export
# - Query all categories, bill_templates, pay_periods (with bills/spending)
# - Return JSON with Content-Disposition header for download
# - Exclude id fields, include only user-editable data

# POST /api/data/import
# - Accept JSON body matching export format
# - Validate structure with Pydantic schema
# - Import order: categories → bill_templates → pay_periods (with bills/spending)
# - Re-map category_id and bill_template_id references by name
# - Return summary of imported counts

# DELETE /api/data/reset
# - Require confirmation header: X-Confirm-Reset: DELETE-ALL-DATA
# - Delete order: pay_periods (cascades bills/spending) → bill_templates → categories
# - Return deleted counts summary
```

**Update:** `backend/app/routes/__init__.py`
- Register new `data_management_bp` blueprint

**New file:** `backend/app/schemas/data_management.py`
- Pydantic models for import validation and response types

### Step 2: Backend Tests

**New file:** `backend/tests/test_data_management.py`
- Test export returns valid JSON structure
- Test import creates correct records
- Test reset deletes all data with proper cascade
- Test reset requires confirmation header

### Step 3: Frontend - API Hook

**New file:** `frontend/src/hooks/useDataManagement.ts`

```typescript
// useExportData() - fetches /api/data/export, triggers file download
// useImportData() - mutation to POST /api/data/import with JSON body
// useResetData() - mutation to DELETE /api/data/reset with confirmation header
```

### Step 4: Frontend - Settings Page Components

**New file:** `frontend/src/components/DataManagement.tsx`

UI Components:
1. **Export Section**
   - "Export Data" button
   - Shows loading state during export
   - Downloads file as `rae-budget-export-YYYY-MM-DD.json`

2. **Import Section**
   - File input for JSON file selection
   - Preview of what will be imported (counts)
   - "Import Data" button with confirmation dialog
   - Warning that existing data will be merged

3. **Reset Section**
   - "Reset All Data" button (red/danger styling)
   - Two-step confirmation:
     1. First click: Opens modal with warning
     2. Modal requires typing "DELETE" to enable confirm button
   - Shows loading state during deletion
   - Success message with counts of deleted items

**Update:** `frontend/src/pages/Settings.tsx`
- Import and render `DataManagement` component
- Add divider between categories section and data management

### Step 5: Frontend Types

**Update:** `frontend/src/types/index.ts`
- Add `DataExport` interface for export structure
- Add `ImportResult` and `ResetResult` interfaces

### Step 6: Frontend Tests

**New file:** `frontend/src/components/DataManagement.test.tsx`
- Test export button triggers download
- Test import file selection and confirmation
- Test reset two-step confirmation flow

---

## Files to Create/Modify

### Backend (5 files)
| Action | File |
|--------|------|
| Create | `backend/app/routes/data_management.py` |
| Create | `backend/app/schemas/data_management.py` |
| Modify | `backend/app/routes/__init__.py` |
| Create | `backend/tests/test_data_management.py` |

### Frontend (5 files)
| Action | File |
|--------|------|
| Create | `frontend/src/hooks/useDataManagement.ts` |
| Create | `frontend/src/components/DataManagement.tsx` |
| Modify | `frontend/src/pages/Settings.tsx` |
| Modify | `frontend/src/types/index.ts` |
| Create | `frontend/src/components/DataManagement.test.tsx` |

---

## Import Logic Details

**Import Order (to handle foreign key references):**
1. Categories (by name, skip if exists)
2. Bill Templates (by name, skip if exists)
3. Pay Periods → Bills → Spending (always create new)

**Name Matching Strategy:**
- Categories: Match by exact name, create if not found
- Bill Templates: Match by exact name, create if not found
- For spending/bills with category_id/bill_template_id:
  - Look up category/template by name from export
  - Find matching local category/template ID
  - Set to null if no match found

---

## Reset Safety Features

1. **API Level:** Requires `X-Confirm-Reset: DELETE-ALL-DATA` header
2. **UI Level:**
   - Warning modal explaining data loss
   - User must type "DELETE" exactly to enable confirm button
   - Confirm button shows "Deleting..." during operation
   - No undo capability (clearly stated in warning)

---

## Verification Plan

### Backend Tests
```bash
docker compose exec api uv run pytest tests/test_data_management.py -v
```

### Frontend Tests
```bash
cd frontend && npm test
```

### Manual E2E Testing
1. Create some test data (pay period, bills, spending, templates, categories)
2. Go to Settings page
3. Click "Export Data" → verify JSON file downloads
4. Inspect JSON file structure
5. Click "Reset All Data" → complete two-step confirmation
6. Verify all data is deleted (dashboard empty)
7. Click "Import Data" → select exported JSON file
8. Verify all data is restored correctly

### API Testing
```bash
# Export
curl http://localhost:5000/api/data/export | jq .

# Reset (with confirmation)
curl -X DELETE http://localhost:5000/api/data/reset \
  -H "X-Confirm-Reset: DELETE-ALL-DATA"

# Import
curl -X POST http://localhost:5000/api/data/import \
  -H "Content-Type: application/json" \
  -d @exported-data.json
```
