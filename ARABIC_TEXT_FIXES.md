# PDF Barcode Labels - Arabic Text Rendering Guide

## Current Implementation Status

### ✅ What's Been Done

1. **Removed printer IP dependency** - No Zebra printer required
2. **PDF generation workflow** - User selects → Preview → Download
3. **UTF-8 Arabic text support** - Basic rendering implemented
4. **Multiple label sizes** - 50×25mm, 40×30mm, 80×50mm, A4
5. **Bulk printing** - Per-product copy quantities
6. **Modern UI** - Clean, green-themed interface

### 🔄 Arabic Text Rendering Issues

Currently using jsPDF's native UTF-8 support with Helvetica font, which has limited Arabic glyph support.

## Solution: Embed Proper Arabic Font

### Option 1: Using a CDN-Hosted TTF Font (Recommended)

```typescript
// In barcodeLabelsGenerator.ts - Add font loading function

const loadArabicFont = async (doc: jsPDF): Promise<void> => {
  try {
    // Fetch Cairo font from CDN
    const fontUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/cairo.ttf";

    const response = await fetch(fontUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Embed font
    doc.addFileToVFS("Cairo-Regular.ttf", base64);
    doc.addFont("Cairo-Regular.ttf", "Cairo", "normal");
    doc.setFont("Cairo");
  } catch (error) {
    console.warn("Arabic font loading failed, using fallback:", error);
    doc.setFont("Helvetica");
  }
};
```

### Option 2: Using Local Font Files

1. Download Arabic TTF fonts:
   - Cairo Regular: https://fonts.google.com/download?family=Cairo
   - Tajawal: https://fonts.google.com/download?family=Tajawal
   - Noto Sans Arabic: https://fonts.google.com/download?family=Noto%20Sans%20Arabic

2. Convert TTF to base64:

```bash
cat cairo.ttf | base64 > cairo.base64
```

3. Embed in code:

```typescript
const CAIRO_FONT_BASE64 = "AAEAAAALAIAAAwAwRkZUTW5kVIcA..."; // Very long string

doc.addFileToVFS("cairo.ttf", CAIRO_FONT_BASE64);
doc.addFont("cairo.ttf", "Cairo", "normal");
doc.setFont("Cairo");
```

### Option 3: Server-Side Font Generation

Generate PDF on backend using:

- **PDFKit** (Node.js) - Supports TTF font embedding
- **reportlab** (Python) - Full Arabic text support
- **iText** (Java) - Professional PDF library

## Expected Output After Fix

```
Current (broken):
þ–þóþ¯ þ®þ˜þàþÓ

After fix:
فلتر زيت

Currency:
Before: Ð.©
After: د.ل
```

## Testing Checklist

- [ ] PDF generates without errors
- [ ] Arabic product names display correctly
- [ ] Currency symbol (د.ل) renders properly
- [ ] Text spacing is normal (not letter-spaced)
- [ ] Barcodes remain sharp and printable
- [ ] Labels print correctly on any printer

## Integration Steps

1. **Update arabicFontLoader.ts** with chosen method
2. **Update barcodeLabelsGenerator.ts** to call font loader
3. **Test with sample products** containing Arabic names
4. **Verify PDF quality** on actual printer

## Alternative: Canvas-Based Rendering

If font embedding fails, use canvas rendering (slower but reliable):

```typescript
// Pre-render Arabic text to canvas, export as image, embed in PDF
const textImage = await renderArabicTextAsImage("فلتر زيت", {
  fontSize: 10,
  color: "black",
});
doc.addImage(textImage, "PNG", 10, 10, 50, 10);
```

## Performance Considerations

- Font embedding increases PDF size by ~50-100KB per font
- Async font loading needed for network requests
- Cache fonts in session to avoid repeated downloads
- Consider server-side generation for large bulk printing

## Production Recommendation

Use **Option 1 (CDN-Hosted Font)** for:

- ✅ No additional dependencies
- ✅ Reliable Unicode support
- ✅ Professional typography
- ✅ Smaller payload than embedded fonts

Use **Server-Side Generation** for:

- ✅ High-volume printing
- ✅ Complex layouts
- ✅ Guaranteed consistency
- ✅ Better performance
