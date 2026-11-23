import xml.etree.ElementTree as ET

def generate_react_component(svg_path, component_name, docstring):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    viewbox = root.attrib.get("viewBox", "0 0 1024 1024")
    paths = list(root.iter("{http://www.w3.org/2000/svg}path"))

    lines = []
    lines.append(f"/**\n * {docstring}\n */")
    lines.append(f"export function {component_name}({{")
    lines.append("  size = 32,")
    lines.append("  className,")
    lines.append("  ...props")
    lines.append("}: React.SVGProps<SVGSVGElement> & { size?: number; className?: string }) {")
    lines.append("  return (")
    lines.append("    <svg")
    lines.append(f'      viewBox="{viewbox}"')
    lines.append('      fill="none"')
    lines.append('      xmlns="http://www.w3.org/2000/svg"')
    lines.append("      width={size}")
    lines.append("      height={size}")
    lines.append('      className={cn("shrink-0 text-foreground", className)}')
    lines.append("      {...props}")
    lines.append("    >")
    for p in paths:
        d = p.attrib.get("d", "")
        transform = p.attrib.get("transform", "")
        trans_attr = f' transform="{transform}"' if transform else ""
        lines.append(f'      <path d="{d}" fill="currentColor"{trans_attr} />')
    lines.append("    </svg>")
    lines.append("  )")
    lines.append("}")
    return "\n".join(lines)

with open("components/logo-ai.tsx", "w", encoding="utf-8") as out:
    out.write('"use client"\n\nimport * as React from "react"\nimport { cn } from "@/lib/utils"\n\n')
    out.write(generate_react_component(
        "public/logo-c1-ai-isometric.svg",
        "LogoConcept1Isometric",
        "Concept 1 (AI 2.5D Isometric): Phím cơ học không gian 3 chiều vát cạnh với chữ T dòng chảy lướt êm ái."
    ))
    out.write("\n\n")
    out.write(generate_react_component(
        "public/logo-c1-ai-topdown.svg",
        "LogoConcept1Topdown",
        "Concept 1 (AI Top-Down): Phím cơ học góc nhìn phẳng từ trên xuống với lòng phím vát mép và chữ T lướt sóng."
    ))
    out.write("\n")

print("Generated components/logo-ai.tsx successfully!")
