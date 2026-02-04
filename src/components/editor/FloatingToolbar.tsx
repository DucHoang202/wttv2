import { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Sparkles,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

interface FloatingToolbarProps {
  onAIEdit: () => void;
}

interface MoreOptionsPopoverProps {
  onFormat: (command: string, value?: string) => void;
}

function MoreOptionsPopover({ onFormat }: MoreOptionsPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="center">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => handleAction(() => onFormat("removeFormat"))}
        >
          Xóa định dạng
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => handleAction(() => {
            const selection = window.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection.toString());
            }
          })}
        >
          Sao chép
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function FloatingToolbar({ onAIEdit }: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position toolbar above selection
      setPosition({
        top: rect.top + window.scrollY - 50,
        left: rect.left + window.scrollX + rect.width / 2
      });
      setIsVisible(true);
    };

    // Listen for selection changes
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, []);

  if (!isVisible) return null;

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-1 flex items-center gap-0.5"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)"
      }}
    >
      {/* AI Improve */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 gap-1.5 text-primary hover:text-primary"
        onClick={onAIEdit}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs">Improve</span>
      </Button>

      <div className="w-px h-5 bg-border" />

      {/* Text formatting */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => handleFormat("bold")}
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => handleFormat("italic")}
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => handleFormat("underline")}
        title="Underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => handleFormat("strikeThrough")}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => handleFormat("formatBlock", "pre")}
        title="Code"
      >
        <Code className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-5 bg-border" />

      {/* Link */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => {
          const url = prompt("Nhập URL:");
          if (url) handleFormat("createLink", url);
        }}
        title="Link"
      >
        <Link className="w-3.5 h-3.5" />
      </Button>

      {/* Comment */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        title="Comment"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-5 bg-border" />

      {/* More options */}
      <MoreOptionsPopover onFormat={handleFormat} />
    </div>
  );
}
