# How to Create Dummy Files for KYC Testing

## Method 1: Using the Script (Recommended)

### Step 1: Run the Script

**On Windows:**
```bash
generate-dummy-kyc-files.bat
```

**On Linux/Mac:**
```bash
node generate-dummy-kyc-files.js
```

This will create a `dummy-kyc-files` folder with all required test files.

---

## Method 2: Manual Creation

### For Image Files (JPG/PNG)

#### Option A: Using Paint/Photoshop
1. Open Paint (Windows) or any image editor
2. Create a new image (any size, e.g., 200x200 pixels)
3. Add some text like "Employee Photo" or "PAN Card"
4. Save as:
   - `employee-photo.jpg`
   - `pan-card.jpg`
   - `aadhaar-front.jpg`
   - `aadhaar-back.jpg`

#### Option B: Using Online Tools
1. Visit: https://www.dummyimage.com/
2. Create images with these settings:
   - Size: 200x200 or 300x300
   - Text: "Employee Photo", "PAN Card", etc.
   - Format: JPG or PNG
3. Download and rename files

#### Option C: Using Command Line (ImageMagick)
```bash
# Install ImageMagick first, then:
magick -size 200x200 xc:white -pointsize 20 -draw "text 10,100 'Employee Photo'" employee-photo.jpg
magick -size 200x200 xc:white -pointsize 20 -draw "text 10,100 'PAN Card'" pan-card.jpg
magick -size 200x200 xc:white -pointsize 20 -draw "text 10,100 'Aadhaar Front'" aadhaar-front.jpg
magick -size 200x200 xc:white -pointsize 20 -draw "text 10,100 'Aadhaar Back'" aadhaar-back.jpg
```

### For PDF Files

#### Option A: Using Microsoft Word/Google Docs
1. Create a new document
2. Add text like "Salary Slip - Month 1" or "Bank Proof"
3. Save/Export as PDF:
   - `salary-slip-month-1.pdf`
   - `salary-slip-month-2.pdf`
   - `salary-slip-month-3.pdf`
   - `bank-proof.pdf`

#### Option B: Using Online PDF Generators
1. Visit: https://www.ilovepdf.com/create-pdf
2. Create simple PDFs with text
3. Download and rename files

#### Option C: Using Command Line
```bash
# Using echo and redirect (creates minimal PDF)
echo "%PDF-1.4" > salary-slip-month-1.pdf
```

---

## Method 3: Download Sample Files

### Free Sample Files Websites:
1. **Pexels** (for images): https://www.pexels.com/
   - Search for "ID card", "document", "photo"
   - Download and rename

2. **Unsplash** (for photos): https://unsplash.com/
   - Search for "portrait", "profile"
   - Download and rename

3. **Sample PDFs**: https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
   - Download and rename for salary slips and bank proof

---

## Quick Test Files Checklist

Create these files in a folder:

### Required Documents:
- [ ] `employee-photo.jpg` (or .png)
- [ ] `pan-card.jpg` (or .png)
- [ ] `aadhaar-front.jpg` (or .png)
- [ ] `aadhaar-back.jpg` (or .png)

### Optional Documents:
- [ ] `salary-slip-month-1.pdf` (or .jpg/.png)
- [ ] `salary-slip-month-2.pdf` (or .jpg/.png)
- [ ] `salary-slip-month-3.pdf` (or .jpg/.png)
- [ ] `bank-proof.pdf` (or .jpg/.png)

---

## File Size Requirements

- **Maximum size:** 10MB per file
- **Recommended size:** 100KB - 2MB for images, 500KB - 5MB for PDFs
- **Minimum size:** Any valid file (even 1KB works)

---

## Testing Tips

1. **Start with small files** (under 1MB) to test quickly
2. **Test file validation** by trying:
   - Files larger than 10MB (should be rejected)
   - Wrong file types (should be rejected)
   - Correct file types (should be accepted)
3. **Test all upload fields** individually
4. **Test form submission** with all required files

---

## Quick Image Creation (Windows)

1. Open **Paint**
2. Press `Ctrl + N` (New)
3. Draw or type something
4. Press `Ctrl + S` (Save)
5. Choose location and name
6. Select format: JPEG or PNG

---

## Quick PDF Creation (Windows)

1. Open **Microsoft Word**
2. Type some text (e.g., "Salary Slip - Month 1")
3. Go to **File > Save As**
4. Choose **PDF** format
5. Save with desired name

---

## Notes

- All files should be valid (not corrupted)
- File extensions must match the actual file type
- For testing, even tiny files (1KB) work fine
- The script creates minimal valid files that are very small (< 1KB each)

