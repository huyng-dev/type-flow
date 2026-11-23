import os
import re

base = r"C:\Users\Mi\.gemini\antigravity\brain\0b89a64a-3ec5-4739-899a-2f9ae9dea9f9"
public_dir = r"c:\Users\Mi\Documents\code\type_flow\type-flow\public"

def process_svg(in_file, out_file, view_box):
    in_path = os.path.join(base, in_file)
    with open(in_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace fill with currentColor
    content = re.sub(r'fill="#000000"', 'fill="currentColor"', content)

    # Replace <svg ...> tag with proper viewBox
    content = re.sub(
        r"<svg[^>]*>",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" fill="none">',
        content,
        count=1
    )

    out_path = os.path.join(public_dir, out_file)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")

# 1. Isometric (2.5D Keycap with fluid wave T)
process_svg("logo_c1_isometric_nobg.svg", "logo-c1-ai-isometric.svg", "72 72 880 880")

# 2. Top-down flat Keycap with fluid wave T
process_svg("logo_c1_topdown_nobg.svg", "logo-c1-ai-topdown.svg", "228 202 620 620")
