import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Sparkles,
  Wand2,
  Maximize2,
  Minimize2,
  RefreshCw,
  MessageSquare
} from "lucide-react";

interface AIEditMenuProps {
  blockId: string;
  onAction: (action: string, prompt?: string) => void;
  onClose: () => void;
}

interface AIAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const aiActions: AIAction[] = [
  {
    id: "improve",
    label: "Cải thiện văn phong",
    description: "Làm cho văn bản mượt mà và chuyên nghiệp hơn",
    icon: <Wand2 className="w-4 h-4" />
  },
  {
    id: "expand",
    label: "Mở rộng nội dung",
    description: "Thêm chi tiết và ngữ cảnh",
    icon: <Maximize2 className="w-4 h-4" />
  },
  {
    id: "shorten",
    label: "Rút gọn",
    description: "Làm ngắn gọn và súc tích hơn",
    icon: <Minimize2 className="w-4 h-4" />
  },
  {
    id: "rewrite",
    label: "Viết lại",
    description: "Viết lại với cách diễn đạt khác",
    icon: <RefreshCw className="w-4 h-4" />
  }
];

export function AIEditMenu({ blockId, onAction, onClose }: AIEditMenuProps) {
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleAction = async (action: string, prompt?: string) => {
    setIsProcessing(true);
    await onAction(action, prompt);
    setIsProcessing(false);
    onClose();
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    await handleAction("custom", customPrompt);
  };

  return (
    <Card
      ref={menuRef}
      className="fixed z-50 w-96 p-3 shadow-lg"
      style={{
        left: "50%",
        top: "30%",
        transform: "translateX(-50%)"
      }}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Sparkles className="w-4 h-4 text-primary" />
  <h3 className="text-sm text-primary title-font" style={{ fontFamily: 'SVN Apparat, Inter Display, system-ui', fontWeight: 500 }}>Chỉnh sửa với AI</h3>
      </div>

      {!showCustomPrompt ? (
        <div className="space-y-1">
          {aiActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isProcessing}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded text-left hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="mt-0.5 text-primary">{action.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-primary">{action.label}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </button>
          ))}

          <button
            onClick={() => setShowCustomPrompt(true)}
            disabled={isProcessing}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded text-left hover:bg-muted transition-colors border-t mt-2 pt-3 disabled:opacity-50"
          >
            <div className="mt-0.5 text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-primary">Yêu cầu tùy chỉnh</div>
              <div className="text-xs text-muted-foreground">
                Mô tả chi tiết cách bạn muốn AI chỉnh sửa
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Viết lại đoạn này theo giọng điệu chuyên nghiệp hơn và thêm số liệu thống kê..."
            rows={4}
            className="w-full"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCustomPrompt}
              disabled={!customPrompt.trim() || isProcessing}
              size="sm"
              className="flex-1 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? "Đang xử lý..." : "Áp dụng"}
            </Button>
            <Button
              onClick={() => setShowCustomPrompt(false)}
              disabled={isProcessing}
              variant="outline"
              size="sm"
            >
              Quay lại
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
        {isProcessing ? "AI đang xử lý yêu cầu..." : "Chọn một tùy chọn hoặc nhấn Esc để đóng"}
      </div>
    </Card>
  );
}
