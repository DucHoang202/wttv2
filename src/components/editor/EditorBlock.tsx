import { useRef, useEffect, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ContentBlock, BlockType } from "../../types";
import { Plus, Image as ImageIcon, BarChart3, Link2 } from "lucide-react";
import { BlockActionsPopover } from "./BlockActionsPopover";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EditorBlockProps {
  block: ContentBlock;
  index: number;
  isFocused: boolean;
  isTitle?: boolean;
  isSapo?: boolean;
  isDraggable?: boolean;
  onFocus: () => void;
  onChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onAddBlock: () => void;
  onTypeChange: (type: BlockType) => void;
  onAIEdit: () => void;
  onAcceptAI: () => void;
  onEditMedia?: () => void;
}

const ITEM_TYPE = "EDITOR_BLOCK";

const blockTypeLabels: Record<BlockType, string> = {
  "heading1": "Heading 1",
  "heading2": "Heading 2", 
  "heading3": "Heading 3",
  "paragraph": "Paragraph",
  "bulleted-list": "Bulleted List",
  "numbered-list": "Numbered List",
  "quote": "Quote",
  "code": "Code",
  "divider": "Divider",
  "image": "Image",
  "chart": "Chart",
  "embed": "Embed"
};

export function EditorBlock({
  block,
  index,
  isFocused,
  isTitle = false,
  isSapo = false,
  isDraggable = true,
  onFocus,
  onChange,
  onKeyDown,
  onDelete,
  onDuplicate,
  onMove,
  onAddBlock,
  onTypeChange,
  onAIEdit,
  onAcceptAI,
  onEditMedia
}: EditorBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    canDrop: () => isDraggable,
    hover(item: { index: number }) {
      if (!ref.current || !isDraggable) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  // Combine drag and drop refs only if draggable
  if (isDraggable) {
    drop(preview(ref));
  }

  // Focus management
  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      if (contentRef.current.childNodes.length > 0) {
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    onChange(text);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const renderContent = () => {
    const commonProps = {
      ref: contentRef,
      contentEditable: block.type !== "divider",
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onPaste: handlePaste,
      onFocus,
      onKeyDown,
      className: `outline-none ${block.type === "divider" ? "" : "min-h-[1.5em]"} ${
        block.text === "" && !isFocused ? "before:content-[attr(data-placeholder)] before:text-muted-foreground before:absolute" : ""
      }`,
      "data-placeholder": getPlaceholder(block.type, isTitle, isSapo)
    };

    // Inline style to force SVN Apparat for headings/titles per user request
    const titleInlineStyle = { fontFamily: 'SVN Apparat, Inter Display, system-ui', fontWeight: 500 } as React.CSSProperties;

    // Merge style into commonProps so returned heading elements also receive inline style
    // Note: some returns override className; we keep className overrides but ensure style is present
    // Attach style via spread when rendering elements using {...commonProps}

    // Special styling for title
    if (isTitle) {
      return <h1 {...commonProps} style={titleInlineStyle} className={`${commonProps.className} text-2xl sm:text-3xl md:text-4xl`}>{block.text}</h1>;
    }

    // Special styling for sapo
    if (isSapo) {
      return <div {...commonProps} style={titleInlineStyle} className={`${commonProps.className} text-muted-foreground`}>{block.text}</div>;
    }

    switch (block.type) {
      case "heading1":
        return <h1 {...commonProps} style={titleInlineStyle} className={`${commonProps.className} text-2xl`}>{block.text}</h1>;
      case "heading2":
        return <h2 {...commonProps} style={titleInlineStyle} className={`${commonProps.className} text-xl`}>{block.text}</h2>;
      case "heading3":
        return <h3 {...commonProps} style={titleInlineStyle} className={`${commonProps.className}`}>{block.text}</h3>;
      case "paragraph":
        return <div {...commonProps}>{block.text}</div>;
      case "bulleted-list":
        return (
          <div className="flex gap-2">
            <span className="flex-shrink-0 select-none">•</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`}>{block.text}</div>
          </div>
        );
      case "numbered-list":
        return (
          <div className="flex gap-2">
            <span className="flex-shrink-0 select-none">{index + 1}.</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`}>{block.text}</div>
          </div>
        );
      case "quote":
        return (
          <blockquote className="border-l-4 border-primary pl-4">
            <div {...commonProps} className={`${commonProps.className} italic`}>{block.text}</div>
          </blockquote>
        );
      case "code":
        return (
          <pre className="bg-muted p-3 rounded font-mono text-sm overflow-x-auto">
            <code {...commonProps}>{block.text}</code>
          </pre>
        );
      case "divider":
        return <hr className="border-border my-4" />;
      case "image":
        return renderImageBlock();
      case "chart":
        return renderChartBlock();
      case "embed":
        return renderEmbedBlock();
      default:
        return <div {...commonProps}>{block.text}</div>;
    }
  };

  const renderImageBlock = () => {
    const url = block.meta?.url || "";
    const alt = block.meta?.alt || "Image";
    
    if (!url) {
      return (
        <button
          onClick={onEditMedia}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors"
        >
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click để thêm hình ảnh
          </p>
        </button>
      );
    }

    return (
      <div className="my-4">
        <ImageWithFallback
          src={url}
          alt={alt}
          className="w-full rounded-lg border border-border"
        />
        {alt && (
          <p className="text-sm text-muted-foreground text-center mt-2 italic">
            {alt}
          </p>
        )}
      </div>
    );
  };

  const renderChartBlock = () => {
    const chartType = block.meta?.chartType || "bar";
    const data = block.meta?.data || [];

    if (!data || data.length === 0) {
      return (
        <button
          onClick={onEditMedia}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors"
        >
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click để thêm biểu đồ
          </p>
        </button>
      );
    }

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
      <div className="my-4 p-4 bg-muted/30 rounded-lg">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          )}
          {chartType === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" />
            </LineChart>
          )}
          {chartType === "pie" && (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
          {chartType === "area" && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderEmbedBlock = () => {
    const url = block.meta?.url || "";
    const embedType = block.meta?.embedType || "iframe";

    if (!url) {
      return (
        <button
          onClick={onEditMedia}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors"
        >
          <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click để thêm embed
          </p>
        </button>
      );
    }

    let embedUrl = url;
    
    // Convert YouTube URL to embed format
    if (embedType === "youtube") {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Convert Twitter URL to embed format
    if (embedType === "twitter") {
      // For demo purposes, just show link since twitter embeds need special handling
      return (
        <div className="my-4 p-4 border border-border rounded-lg bg-muted/30">
          <p className="text-sm mb-2">Twitter Embed:</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {url}
          </a>
        </div>
      );
    }

    return (
      <div className="my-4">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg border border-border"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative py-1 transition-all
        ${isDragging ? "opacity-50" : ""}
        ${isTitle || isSapo ? "" : "px-1 -mx-1"}
      `}
    >
      {/* Left toolbar - only show for draggable content blocks */}
      {isDraggable && !isTitle && !isSapo && (
        <div className={`
          absolute left-0 top-1 -ml-10 flex items-center gap-1
          transition-opacity ${isHovered || isFocused ? "opacity-100" : "opacity-0"}
        `}>
          {/* Drag handle with popover */}
          <div ref={drag}>
            <BlockActionsPopover
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAddBlock={onAddBlock}
              onTypeChange={onTypeChange}
              onAIEdit={onAIEdit}
              currentType={block.type}
            />
          </div>

          {/* Add button */}
          <button
            onClick={onAddBlock}
            className="p-1 hover:bg-muted rounded"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {renderContent()}
      </div>
    </div>
  );
}

function getPlaceholder(type: BlockType, isTitle = false, isSapo = false): string {
  if (isTitle) return "Tiêu đề bài viết";
  if (isSapo) return "Sapo - Tóm tắt ngắn gọn nội dung bài viết...";
  switch (type) {
    case "heading1":
      return "Heading 1";
    case "heading2":
      return "Heading 2";
    case "heading3":
      return "Heading 3";
    case "paragraph":
      return "Nhấn / để mở menu lệnh";
    case "bulleted-list":
      return "Mục danh sách";
    case "numbered-list":
      return "Mục danh sách";
    case "quote":
      return "Trích dẫn";
    case "code":
      return "Code";
    case "image":
      return "";
    case "chart":
      return "";
    case "embed":
      return "";
    default:
      return "";
  }
}
