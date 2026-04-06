from pathlib import Path

replacements = {
    "src/components/SidebarNav.tsx": [
        ("fill={active ? '#e9edef' : '#aebac1'}", "fill={active ? '#0f172a' : '#64748b'}"),
        ("stroke={active ? '#e9edef' : '#aebac1'}", "stroke={active ? '#0f172a' : '#64748b'}"),
        ("group-hover:bg-[#2a3942]", "group-hover:bg-[#dbeafe]"),
        ("fill=\"#aebac1\"", "fill=\"#64748b\"")
    ],
    "src/components/Sidebar.tsx": [
        ("text-[#e9edef]", "text-[#0f172a]"),
        ("fill=\"#aebac1\"", "fill=\"#64748b\""),
        ("placeholder-[#8696a0]", "placeholder-[#94a3b8]"),
        ("text-[#e9edef99]", "text-[#64748b]"),
        ("bg-[#202c33]", "bg-[#eff6ff]"),
        ("hover:bg-[#26353d]", "hover:bg-[#dbeafe]"),
        ("bg-[#233138]", "bg-[#ffffff]"),
        ("bg-[#2a3942]", "bg-[#dbeafe]"),
        ("text-[#8696a0]", "text-[#64748b]"),
        ("border-[#222d34]", "border-[#dbeafe]"),
        ("pl-[13px] pr-[15px]", "pl-[18px] pr-[18px]"),
        ("py-[16px]", "py-[18px]")
    ],
    "src/components/ChatWindow.tsx": [
        ("bg-[#222e35]", "bg-[#eff6ff]"),
        ("bg-[#00a884]", "bg-[#0f74ff]"),
        ("bg-[#364147]", "bg-[#c7d2e0]"),
        ("text-[#e9edef]", "text-[#0f172a]"),
        ("text-[#8696a0]", "text-[#64748b]"),
        ("text-[#667781]", "text-[#64748b]"),
        ("hover:bg-[#06cf9c]", "hover:bg-[#3b82f6]"),
        ("bg-[#202c33]", "bg-[#eff6ff]"),
        ("hover:bg-[#2a3942]", "hover:bg-[#dbeafe]"),
        ("bg-[#233138]", "bg-[#ffffff]"),
        ("bg-[#2a3942]", "bg-[#dbeafe]"),
        ("bg-[#005c4b]", "bg-[#dbeafe]"),
        ("bg-[#1c2b30]", "bg-[#eff6ff]"),
        ("bg-[#111b21]", "bg-[#e2e8f0]"),
        ("fill=\"#8696a0\"", "fill=\"#64748b\""),
        ("fill=\"#53bdeb\"", "fill=\"#3b82f6\""),
        ("placeholder-[#8696a0]", "placeholder-[#94a3b8]"),
        ("group-hover:bg-[#2a3942]", "group-hover:bg-[#dbeafe]"),
        ("fill=\"currentColor\"", "fill=\"#64748b\"")
    ]
}

for path, subs in replacements.items():
    p = Path(path)
    if not p.exists():
        print(f'File not found: {path}')
        continue
    text = p.read_text(encoding='utf-8')
    original = text
    for old, new in subs:
        text = text.replace(old, new)
    if text != original:
        p.write_text(text, encoding='utf-8')
        print(f'Updated {path}')
    else:
        print(f'No changes in {path}')
