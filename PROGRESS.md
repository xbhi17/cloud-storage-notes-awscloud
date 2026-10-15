# PROGRESS

This document tracks progress, regression gates, architectural decisions, and constraints for redesigning the UI into a dense, full-screen dark cloud-storage dashboard.

---

## Baseline Route Table

The Flask URL map contract MUST be maintained identically throughout all redesign phases:

| Path | Methods | Endpoint | Purpose |
|---|---|---|---|
| `/` | `GET` | `index` | Main dashboard displaying files and search |
| `/upload` | `POST` | `upload` | File upload handler |
| `/download/<path:filename>` | `GET` | `download` | Generates S3 presigned URL and redirects |
| `/delete/<path:filename>` | `POST` | `delete` | S3 object deletion handler |
| `/static/<path:filename>` | `GET` | `static` | Static file serving (Flask default) |

---

## Form Field Names Per Route

| Route | Method | Form Field / Param Name | Type / Note |
|---|---|---|---|
| `/upload` | `POST` | `file` | `multipart/form-data` file input (`request.files['file']`) |
| `/` | `GET` | `search` | Query parameter (`request.args.get('search', '')`) |
| `/delete/<path:filename>` | `POST` | *None* | Path parameter `filename`; form action directly specifies target |

---

## Template Variables Each Template Receives

### `src/templates/index.html`

* `files`: List of dictionaries representing S3 objects. Each item contains:
  * `key` (`str`): S3 object key / filename
  * `size` (`float`): File size in kilobytes (`KB`), rounded to 2 decimal places (`round(obj['Size'] / 1024, 2)`)
  * `last_modified` (`str`): Formatted timestamp string `"%Y-%m-%d %H:%M:%S"`
* `query` (`str`): Current search string from `request.args.get('search', '')`
* Flashed Messages (`get_flashed_messages(with_categories=true)`):
  * Categories used in code: `"success"`, `"danger"`

---

## File Metadata Actually Available

From `src/s3_manager.py` (`S3Manager.list_files`):
1. **Filename / Key**: `file.key` (string)
2. **File Size**: `file.size` in KB (numeric float)
3. **Last Modified**: `file.last_modified` (string formatted `%Y-%m-%d %H:%M:%S`)
4. **Content Type**: Detected at upload time via `mimetypes.guess_type(filename)` and saved in S3 object metadata (`ContentType`), but **not** retrieved or returned in `list_files` (`list_objects_v2` call).
5. **No database or other metadata**: No tags, no author, no download counts, no custom folders, no user ownership. (Rule 5: *No mock or fabricated data; omit elements if data doesn't exist*).

---

## How Upload, Download, and Delete Currently Work

### Upload Flow
1. User submits a multipart POST form to `/upload` with file input `name="file"`.
2. `upload()` validates that `'file'` is in `request.files` and `file.filename != ''`.
3. `filename` is sanitized using `werkzeug.utils.secure_filename(file.filename)`.
4. `S3Manager.upload_file(file, filename)` guesses MIME type and calls `boto3.client('s3').upload_fileobj(file_obj, bucket, filename, ExtraArgs={"ContentType": content_type})`.
5. Success or failure triggers `flash()` and redirects to `url_for('index')`.

### Download Flow (Presigned URL)
1. User clicks download link pointing to `/download/<path:filename>`.
2. Flask route calls `S3Manager.get_download_url(filename)`.
3. `boto3` generates a secure presigned URL via `generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': filename}, ExpiresIn=3600)`.
4. Flask issues a `302 redirect(url)`. The raw S3 bucket is never public.

### Delete Flow
1. User triggers POST to `/delete/<path:filename>` via a form button (with JavaScript confirmation prompt).
2. Flask route calls `S3Manager.delete_file(filename)`.
3. `boto3` calls `delete_object(Bucket=bucket, Key=filename)`.
4. Result flashes a message and redirects to `url_for('index')`.

---

## Security Observations
* **CSRF Protection**: No CSRF tokens are implemented in POST forms (`/upload` and `/delete/<path:filename>`). Adding Flask-WTF or CSRF protection would require contract validation.
* **Filename Sanitization**: Upload uses `secure_filename()`. However, `secure_filename` strips slashes and non-ASCII characters; nested pseudo-directories in S3 are not supported by the default sanitizer.
* **Deletion Method**: Delete is correctly performed via `POST` (not `GET`), avoiding search engine crawler accidental deletes.
* **Public S3 Access**: Bucket is kept private; files are securely accessed via temporary presigned URLs expiring in 1 hour (3600s).
* **Credential Exposure**: AWS credentials are read from environment variables; `.env` is ignored by `.gitignore`. No credentials or raw S3 URLs are rendered in HTML templates.
* **File Validation**: Currently no file type allowlisting or max size restrictions exist in Flask routes before passing to Boto3.

---

## Regression Gate Instructions

Run the route regression and behavior test suite:
```bash
./venv/bin/python -m unittest discover tests
```

To print and verify the live Flask URL map:
```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_BUCKET_NAME=test-bucket ./venv/bin/python -c "
from src.app import app
for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
    methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
    print(f'{rule.rule} | {methods} | {rule.endpoint}')
"
```

---

## Part Checklist

- [x] **Part 0: Safety Net & Repository Baseline** (DONE)
- [x] **Part 1: Self-Hosted Static Assets & Design System Foundation** (DONE)
- [ ] **Part 2: Dark Full-Screen Layout Shell & Navigation** (TODO)
- [ ] **Part 3: Dense File Explorer & Resource Data Table** (TODO)
- [ ] **Part 4: Upload Modal & Action Workflows** (TODO)
- [ ] **Part 5: Search, Filter, & Sorting Interactions** (TODO)
- [ ] **Part 6: Final Polish, Accessibility & End-to-End Verification** (TODO)

---

## Part Status History

### Part 0: Safety Net & Repository Baseline
* **Status**: DONE
* **Files Touched**:
  * `.gitignore`
  * `.env.example`
  * `tests/test_baseline.py`
  * `PROGRESS.md`
* **Decisions Made**:
  * Initialized git repository on branch `ui-redesign` matching remote `https://github.com/mallidimohan41297/cloud-storage-notes-awscloud.git` (commit `adf2a26`).
  * Created automated regression test gate in `tests/test_baseline.py` using standard library `unittest` (no extra external test runners required).
  * Maintained 100% clean baseline without modifying any existing production code or route contracts.
* **Open Issues**:
  * None.

### Part 1: Self-Hosted Static Assets & Design System Foundation
* **Status**: DONE
* **Files Touched**:
  * `src/static/vendor/bootstrap.min.css` (Self-hosted Bootstrap 5.3.0)
  * `src/static/vendor/bootstrap.bundle.min.js` (Self-hosted Bootstrap 5.3.0 bundle)
  * `src/static/css/dashboard.css` (Design tokens, base, 100dvh layout, components, utilities)
  * `src/static/js/dashboard.js` (Keyboard shortcut `/` for search, tooltips, view switcher)
  * `src/templates/partials/icons.html` (Jinja SVG macro for self-hosted inline icons)
  * `src/templates/partials/sidebar.html` (64-72px icon-only nav landmark with active state)
  * `src/templates/partials/topbar.html` (56px header landmark with search, view toggles, upload trigger)
  * `src/templates/base.html` (Core layout shell with landmarks: nav, header, main content)
  * `src/templates/index.html` (Refactored to extend base.html while preserving all routes and contracts)
  * `screenshots/shell_1366x768.png` (Screenshot at 1366x768)
  * `screenshots/shell_1920x1080.png` (Screenshot at 1920x1080)
  * `PROGRESS.md` (Updated tracking)
* **Decisions Made**:
  * Fully eliminated CDN dependencies for Bootstrap 5 and icons; placed self-hosted vendor files in `src/static/vendor/` and SVG macros in `src/templates/partials/icons.html`.
  * Created comprehensive design tokens with `--bg #080909`, `--surface #171A17`, `--surface-2 #212621`, `--border rgba(255,255,255,0.08)`, and accent roles (`--lime #C7F36B`, `--orange #FF512B`, `--blue #1765D1`, `--pink #F49AC2`, `--green #347748`, `--yellow #FFC52E`).
  * Enforced full viewport shell at `100dvh` without document-level scroll; main content region has styled custom scrollbars and safe inner padding (16px desktop, 12px mobile).
  * Maintained exact route and form contracts (`/`, `/upload`, `/download/<path:filename>`, `/delete/<path:filename>`).
* **Open Issues**:
  * Existing form sections are placed within dark cards; Part 2 and 3 will refine the table density and file metadata presentation.

