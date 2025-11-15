# Public Assets Directory

This directory contains static assets that are served directly by the web server.

## Logo Files

To add the logo, place these files in this directory:

- `rsamriddhi_logo.png` - Main logo (used on login page and header)
- `rsamriddhi_logo-short.png` - Short/favicon version of the logo

## File Structure

```
frontend/public/
├── rsamriddhi_logo.png          # Main logo image
├── rsamriddhi_logo-short.png    # Favicon/short logo
└── README.md                    # This file
```

## Notes

- Files in this directory are accessible at the root path (e.g., `/rsamriddhi_logo.png`)
- The application will show a text logo fallback if the image files are not found
- After adding logo files, rebuild the frontend for changes to take effect

