#!/usr/bin/env python3
"""Regenerate every app icon from the master SVGs in assets/icon/.

Sources:
  assets/icon/pdf3md.svg   full macOS-style icon (rounded square with margin)
  assets/icon/favicon.svg  same art cropped to the square, for small sizes

Outputs:
  assets/icon/pdf3md-1024.png, assets/icon/favicon-1024.png
  macos/PDF3MD.icns                    (iconutil, full-margin version)
  windows/PDF3MD.ico                   (16..256, cropped version)
  pdf3md/public/favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180)
  assets/dmg/background.tiff           (DMG window background, 1x + 2x)

Rendering is done with headless Google Chrome (supports feDropShadow);
set CHROME=/path/to/chrome to override. Only the Python stdlib is needed.
Run:  python3 scripts/build_icons.py   (or scripts/build_icons.sh)
"""
import os
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICON_DIR = ROOT / "assets" / "icon"
FULL_SVG = ICON_DIR / "pdf3md.svg"
CROP_SVG = ICON_DIR / "favicon.svg"

CHROME_CANDIDATES = [
    os.environ.get("CHROME", ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
    shutil.which("chromium-browser") or "",
]


def find_chrome() -> str:
    for c in CHROME_CANDIDATES:
        if c and Path(c).exists():
            return c
    sys.exit("Chrome/Chromium not found; set CHROME=/path/to/chrome")


def render(chrome: str, svg: Path, size: int, out: Path, tmp: Path, height: int | None = None) -> None:
    """Render svg to a transparent PNG of size x height (square by default)."""
    width, height = size, height or size
    html = tmp / f"r_{svg.stem}_{width}x{height}.html"
    html.write_text(
        "<!doctype html><html><head><style>"
        "html,body{margin:0;padding:0;background:transparent;overflow:hidden}"
        f"img{{display:block;width:{width}px;height:{height}px}}"
        f"</style></head><body><img src='{svg.as_uri()}'></body></html>",
        encoding="utf-8",
    )
    out.unlink(missing_ok=True)
    subprocess.run(
        [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--allow-file-access-from-files",
            "--force-device-scale-factor=1",
            "--default-background-color=00000000",
            f"--user-data-dir={tmp / 'profile'}",
            f"--window-size={width},{height}",
            f"--screenshot={out}",
            html.as_uri(),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    w, h = png_size(out)
    if (w, h) != (width, height):
        sys.exit(f"{out}: expected {width}x{height}, got {w}x{h}")


def png_size(p: Path) -> tuple:
    data = p.read_bytes()[:24]
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{p} is not a PNG")
    return struct.unpack(">II", data[16:24])


def write_ico(pngs: list, out: Path) -> None:
    """Pack PNG images into a .ico (PNG-compressed entries, Vista+)."""
    blobs = [p.read_bytes() for p in pngs]
    header = struct.pack("<HHH", 0, 1, len(blobs))
    offset = 6 + 16 * len(blobs)
    entries = b""
    for p, blob in zip(pngs, blobs):
        w, h = png_size(p)
        entries += struct.pack(
            "<BBBBHHII", w % 256, h % 256, 0, 0, 1, 32, len(blob), offset
        )
        offset += len(blob)
    out.write_bytes(header + entries + b"".join(blobs))


def main() -> None:
    chrome = find_chrome()
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        cache = {}

        def png(svg: Path, size: int) -> Path:
            key = (svg, size)
            if key not in cache:
                out = tmp / f"{svg.stem}_{size}.png"
                render(chrome, svg, size, out, tmp)
                cache[key] = out
            return cache[key]

        # Master PNGs
        shutil.copy(png(FULL_SVG, 1024), ICON_DIR / "pdf3md-1024.png")
        shutil.copy(png(CROP_SVG, 1024), ICON_DIR / "favicon-1024.png")

        # macOS .icns (full-margin version, Apple template)
        iconset = tmp / "PDF3MD.iconset"
        iconset.mkdir()
        for base in (16, 32, 128, 256, 512):
            shutil.copy(png(FULL_SVG, base), iconset / f"icon_{base}x{base}.png")
            shutil.copy(
                png(FULL_SVG, base * 2), iconset / f"icon_{base}x{base}@2x.png"
            )
        icns = ROOT / "macos" / "PDF3MD.icns"
        if shutil.which("iconutil"):
            subprocess.run(
                ["iconutil", "-c", "icns", str(iconset), "-o", str(icns)], check=True
            )
        else:
            print("iconutil not found (not macOS?) - skipping macos/PDF3MD.icns")

        # Windows .ico (cropped version)
        write_ico(
            [png(CROP_SVG, s) for s in (16, 24, 32, 48, 64, 128, 256)],
            ROOT / "windows" / "PDF3MD.ico",
        )

        # Web favicons
        public = ROOT / "pdf3md" / "public"
        public.mkdir(parents=True, exist_ok=True)
        shutil.copy(CROP_SVG, public / "favicon.svg")
        write_ico([png(CROP_SVG, s) for s in (16, 32, 48)], public / "favicon.ico")
        shutil.copy(png(CROP_SVG, 180), public / "apple-touch-icon.png")

        # DMG window background (640x400 @1x and @2x -> one HiDPI TIFF)
        bg_svg = ROOT / "assets" / "dmg" / "background.svg"
        if bg_svg.exists():
            bg1, bg2 = tmp / "bg.png", tmp / "bg@2x.png"
            render(chrome, bg_svg, 640, bg1, tmp, 400)
            render(chrome, bg_svg, 1280, bg2, tmp, 800)
            tiff = ROOT / "assets" / "dmg" / "background.tiff"
            if shutil.which("tiffutil"):
                subprocess.run(
                    ["tiffutil", "-cathidpicheck", str(bg1), str(bg2), "-out", str(tiff)],
                    check=True,
                    stdout=subprocess.DEVNULL,
                )
            else:
                shutil.copy(bg1, ROOT / "assets" / "dmg" / "background.png")

    print("Icons generated:")
    for p in (
        ICON_DIR / "pdf3md-1024.png",
        ICON_DIR / "favicon-1024.png",
        ROOT / "macos" / "PDF3MD.icns",
        ROOT / "windows" / "PDF3MD.ico",
        public / "favicon.svg",
        public / "favicon.ico",
        public / "apple-touch-icon.png",
        ROOT / "assets" / "dmg" / "background.tiff",
    ):
        if p.exists():
            print(f"  {p.relative_to(ROOT)}  ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
