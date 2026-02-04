import { useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Sliders, Sparkles } from "lucide-react";
import { StyleControls } from "../types";
import { logEvent } from "../lib/telemetry";

interface StyleControlPanelProps {
  controls: StyleControls;
  onChange: (controls: StyleControls) => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function StyleControlPanel({ controls, onChange, onApply, isApplying = false }: StyleControlPanelProps) {
  const [pendingControls, setPendingControls] = useState<StyleControls>(controls);

  // Labels for selected values (displayed in trigger)
  const toneLabels = {
    formal: "Trang trọng",
    professional: "Chuyên nghiệp",
    friendly: "Thân thiện",
    casual: "Thoải mái"
  };

  const lengthLabels = {
    short: "Ngắn gọn",
    medium: "Vừa phải",
    long: "Chuyên sâu"
  };

  const complexityLabels = {
    simple: "Đơn giản",
    moderate: "Trung bình",
    advanced: "Chuyên môn"
  };

  const languageLabels = {
    vi: "Tiếng Việt",
    en: "Tiếng Anh"
  };

  const handleToneChange = (tone: StyleControls["tone"]) => {
    setPendingControls({ ...pendingControls, tone });
  };

  const handleLengthChange = (length: StyleControls["length"]) => {
    setPendingControls({ ...pendingControls, length });
  };

  const handleComplexityChange = (complexity: StyleControls["complexity"]) => {
    setPendingControls({ ...pendingControls, complexity });
  };

  const handleLanguageChange = (language: StyleControls["language"]) => {
    setPendingControls({ ...pendingControls, language });
  };

  const handleApply = () => {
    onChange(pendingControls);
    onApply();
    logEvent("style_applied", { 
      tone: pendingControls.tone, 
      length: pendingControls.length,
      complexity: pendingControls.complexity,
      language: pendingControls.language
    });
  };

  const hasChanges = 
    pendingControls.tone !== controls.tone ||
    pendingControls.length !== controls.length ||
    pendingControls.complexity !== controls.complexity ||
    pendingControls.language !== controls.language;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <Sliders className="w-4 h-4 text-primary" />
        <h3 className="text-sm">Điều chỉnh giọng văn</h3>
      </div>

      <div className="space-y-4">
        {/* Tone */}
        <div>
          <Label className="text-xs mb-2 block">Giọng điệu</Label>
          <Select value={pendingControls.tone} onValueChange={handleToneChange}>
            <SelectTrigger className="w-full">
              <span>{toneLabels[pendingControls.tone]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">
                <div className="flex flex-col items-start">
                  <span>Trang trọng</span>
                  <span className="text-xs text-muted-foreground">Phù hợp bài phân tích, báo cáo</span>
                </div>
              </SelectItem>
              <SelectItem value="professional">
                <div className="flex flex-col items-start">
                  <span>Chuyên nghiệp</span>
                  <span className="text-xs text-muted-foreground">Cân bằng trang trọng & dễ hiểu</span>
                </div>
              </SelectItem>
              <SelectItem value="friendly">
                <div className="flex flex-col items-start">
                  <span>Thân thiện</span>
                  <span className="text-xs text-muted-foreground">Gần gũi, dễ đọc</span>
                </div>
              </SelectItem>
              <SelectItem value="casual">
                <div className="flex flex-col items-start">
                  <span>Thoải mái</span>
                  <span className="text-xs text-muted-foreground">Phong cách trò chuyện</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Length */}
        <div>
          <Label className="text-xs mb-2 block">Độ dài nội dung</Label>
          <Select value={pendingControls.length} onValueChange={handleLengthChange}>
            <SelectTrigger className="w-full">
              <span>{lengthLabels[pendingControls.length]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">
                <div className="flex flex-col items-start">
                  <span>Ngắn gọn</span>
                  <span className="text-xs text-muted-foreground">300-500 từ</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex flex-col items-start">
                  <span>Vừa phải</span>
                  <span className="text-xs text-muted-foreground">500-1000 từ</span>
                </div>
              </SelectItem>
              <SelectItem value="long">
                <div className="flex flex-col items-start">
                  <span>Chuyên sâu</span>
                  <span className="text-xs text-muted-foreground">1000+ từ</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complexity */}
        <div>
          <Label className="text-xs mb-2 block">Độ phức tạp</Label>
          <Select value={pendingControls.complexity} onValueChange={handleComplexityChange}>
            <SelectTrigger className="w-full">
              <span>{complexityLabels[pendingControls.complexity]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">
                <div className="flex flex-col items-start">
                  <span>Đơn giản</span>
                  <span className="text-xs text-muted-foreground">Tránh thuật ngữ</span>
                </div>
              </SelectItem>
              <SelectItem value="moderate">
                <div className="flex flex-col items-start">
                  <span>Trung bình</span>
                  <span className="text-xs text-muted-foreground">Có giải thích</span>
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex flex-col items-start">
                  <span>Chuyên môn</span>
                  <span className="text-xs text-muted-foreground">Thuật ngữ chuyên ngành</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <Label className="text-xs mb-2 block">Ngôn ngữ</Label>
          <Select value={pendingControls.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <span>{languageLabels[pendingControls.language]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">
                <div className="flex flex-col items-start">
                  <span>Tiếng Việt</span>
                  <span className="text-xs text-muted-foreground">Vietnamese</span>
                </div>
              </SelectItem>
              <SelectItem value="en">
                <div className="flex flex-col items-start">
                  <span>Tiếng Anh</span>
                  <span className="text-xs text-muted-foreground">English</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apply Button */}
        <Button 
          onClick={handleApply}
          disabled={!hasChanges || isApplying}
          className="w-full gap-2 text-primary hover:text-primary"
          variant={hasChanges ? "default" : "outline"}
        >
          <Sparkles className="w-4 h-4" />
          {isApplying ? "Đang điều chỉnh..." : "Áp dụng điều chỉnh"}
        </Button>

        {hasChanges && (
          <p className="text-xs text-muted-foreground text-center">
            AI sẽ điều chỉnh toàn bộ nội dung theo thiết lập mới
          </p>
        )}
      </div>
    </div>
  );
}
