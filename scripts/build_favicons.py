import os
import re

base_svg = r"c:\Users\Mi\Documents\code\type_flow\type-flow\public\logo-c1-ai-isometric.svg"
public_dir = r"c:\Users\Mi\Documents\code\type_flow\type-flow\public"

with open(base_svg, "r", encoding="utf-8") as f:
    content = f.read()

# Extract paths (removing existing fill="currentColor")
paths_only = re.sub(r'fill="currentColor"', "", content)
# Remove <?xml ...>, comments, <svg>, </svg>
svg_body_match = re.search(r"<svg[^>]*>(.*)</svg>", paths_only, re.DOTALL)
if not svg_body_match:
    raise ValueError("Could not find svg body")
svg_body = svg_body_match.group(1).strip()

viewbox = "72 72 880 880"

# 1. Favicon Light: Dark Charcoal/Black (#18181b) for light browser tabs
favicon_light = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" fill="none">
  <style>
    path {{ fill: #18181b; }}
  </style>
  {svg_body}
</svg>
"""

# 2. Favicon Dark: Pure Crisp White (#ffffff) for dark browser tabs
favicon_dark = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" fill="none">
  <style>
    path {{ fill: #ffffff; }}
  </style>
  {svg_body}
</svg>
"""

# 3. Favicon Adaptive: Auto-adapts with CSS prefers-color-scheme
favicon_adaptive = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" fill="none">
  <style>
    path {{ fill: #18181b; }}
    @media (prefers-color-scheme: dark) {{
      path {{ fill: #ffffff; }}
    }}
  </style>
  {svg_body}
</svg>
"""

with open(os.path.join(public_dir, "favicon-light.svg"), "w", encoding="utf-8") as f:
    f.write(favicon_light)
print("Generated public/favicon-light.svg")

with open(os.path.join(public_dir, "favicon-dark.svg"), "w", encoding="utf-8") as f:
    f.write(favicon_dark)
print("Generated public/favicon-dark.svg")

with open(os.path.join(public_dir, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(favicon_adaptive)
print("Generated public/favicon.svg")
