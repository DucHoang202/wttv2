import { useState, useEffect, useRef } from "react";
import { BlockType } from "../../types";
import { Card } from "../ui/card";
import {
  Type,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image,
  BarChart3
} from "lucide-react";

interface BlockMenuProps {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const blockOptions: BlockOption[] = [
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Đoạn văn bản thông thường",
    icon: <AlignLeft className="w-4 h-4" />,
    keywords: ["text", "paragraph", "p", "doan", "van"]
  },
  {
    type: "heading1",
    label: "Heading 1",
    description: "Tiêu đề cấp 1",
    icon: <Type className="w-4 h-4" />,
    keywords: ["h1", "heading", "title", "tieu", "de"]
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Tiêu đề cấp 2",
    icon: <Type className="w-4 h-4" />,
    keywords: ["h2", "heading", "subtitle", "tieu", "de"]
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Tiêu đề cấp 3",
    icon: <Type className="w-4 h-4" />,
    keywords: ["h3", "heading", "tieu", "de"]
  },
  {
    type: "bulleted-list",
    label: "Bulleted List",
    description: "Danh sách có dấu đầu dòng",
    icon: <List className="w-4 h-4" />,
    keywords: ["list", "bullet", "ul", "danh", "sach"]
  },
  {
    type: "numbered-list",
    label: "Numbered List",
    description: "Danh sách có số thứ tự",
    icon: <ListOrdered className="w-4 h-4" />,
    keywords: ["list", "number", "ol", "danh", "sach", "so"]
  },
  {
    type: "quote",
    label: "Quote",
    description: "Trích dẫn",
    icon: <Quote className="w-4 h-4" />,
    keywords: ["quote", "blockquote", "trich", "dan"]
  },
  {
    type: "code",
    label: "Code",
    description: "Khối mã nguồn",
    icon: <Code className="w-4 h-4" />,
    keywords: ["code", "pre", "ma"]
  },
  {
    type: "divider",
    label: "Divider",
    description: "Đường phân cách",
    icon: <Minus className="w-4 h-4" />,
    keywords: ["divider", "hr", "line", "phan", "cach"]
  },
  {
    type: "image",
    label: "Image",
    description: "Chèn hình ảnh",
    icon: <Image className="w-4 h-4" />,
    keywords: ["image", "img", "picture", "photo", "hinh", "anh"]
  },
  {
    type: "chart",
    label: "Chart",
    description: "Chèn biểu đồ",
    icon: <BarChart3 className="w-4 h-4" />,
    keywords: ["chart", "graph", "bieu", "do"]
  }
];

export function BlockMenu({ query, onSelect, onClose }: BlockMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter options based on query
  const filteredOptions = blockOptions.filter(option => {
    if (!query) return true;
    const searchQuery = query.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchQuery) ||
      option.description.toLowerCase().includes(searchQuery) ||
      option.keywords.some(k => k.includes(searchQuery))
    );
  });

  // Reset selection when filtered options change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          onSelect(filteredOptions[selectedIndex].type);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredOptions, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filteredOptions.length === 0) {
    return null;
  }

  return (
    <Card
      ref={menuRef}
      className="fixed z-50 w-80 p-2 shadow-lg"
      style={{
        left: "50%",
        top: "30%",
        transform: "translateX(-50%)"
      }}
    >
      <div className="text-xs text-muted-foreground px-2 py-1.5 border-b mb-1">
        Chọn loại block
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filteredOptions.map((option, index) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={`
              w-full flex items-start gap-3 px-2 py-2 rounded text-left
              transition-colors
              ${index === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted"}
            `}
          >
            <div className="mt-0.5">{option.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground px-2 py-1.5 border-t mt-1">
        ↑↓ để chọn • Enter để xác nhận • Esc để đóng
      </div>
    </Card>
  );
}
