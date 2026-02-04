import { useState } from "react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Type,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  BarChart3,
  Link2
} from "lucide-react";
import { BlockType } from "../../types";

interface BlockActionsPopoverProps {
  onDelete: () => void;
  onDuplicate: () => void;
  onAddBlock: () => void;
  onTypeChange: (type: BlockType) => void;
  onAIEdit: () => void;
  currentType: BlockType;
}

const blockTypeOptions = [
  { type: "paragraph" as BlockType, label: "Text", icon: AlignLeft },
  { type: "heading1" as BlockType, label: "Heading 1", icon: Heading1 },
  { type: "heading2" as BlockType, label: "Heading 2", icon: Heading2 },
  { type: "heading3" as BlockType, label: "Heading 3", icon: Heading3 },
  { type: "bulleted-list" as BlockType, label: "Bulleted list", icon: List },
  { type: "numbered-list" as BlockType, label: "Numbered list", icon: ListOrdered },
  { type: "quote" as BlockType, label: "Quote", icon: Quote },
  { type: "code" as BlockType, label: "Code", icon: Code },
  { type: "image" as BlockType, label: "Hình ảnh", icon: Image },
  { type: "chart" as BlockType, label: "Biểu đồ", icon: BarChart3 },
  { type: "embed" as BlockType, label: "Embed", icon: Link2 }
];

export function BlockActionsPopover({
  onDelete,
  onDuplicate,
  onAddBlock,
  onTypeChange,
  onAIEdit,
  currentType
}: BlockActionsPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start" side="left">
        <div className="space-y-1">
          {/* Quick actions */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => handleAction(onDelete)}
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => handleAction(onDuplicate)}
          >
            <Copy className="w-4 h-4" />
            Nhân bản
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => handleAction(onAddBlock)}
          >
            <Plus className="w-4 h-4" />
            Thêm block bên dưới
          </Button>

          <div className="h-px bg-border my-1" />

          {/* AI Actions */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-primary hover:text-primary"
            onClick={() => handleAction(onAIEdit)}
          >
            <Sparkles className="w-4 h-4" />
            Chỉnh sửa với AI
          </Button>

          <div className="h-px bg-border my-1" />

          {/* Transform to */}
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Chuyển đổi thành
          </div>
          {blockTypeOptions.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className={`w-full justify-start gap-2 h-8 ${
                currentType === type ? "bg-muted" : ""
              }`}
              onClick={() => handleAction(() => onTypeChange(type))}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
