import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Image, BarChart3, Link2, Search } from "lucide-react";

interface MediaInsertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (url: string, alt?: string) => void;
  onInsertChart: (chartType: string, data: any) => void;
  onInsertEmbed: (url: string, type: string) => void;
  initialTab?: "image" | "chart" | "embed";
  initialImageUrl?: string;
  initialImageAlt?: string;
  initialChartType?: string;
  initialChartData?: any;
  initialEmbedUrl?: string;
  initialEmbedType?: string;
}

export function MediaInsertDialog({
  isOpen,
  onClose,
  onInsertImage,
  onInsertChart,
  onInsertEmbed,
  initialTab = "image",
  initialImageUrl = "",
  initialImageAlt = "",
  initialChartType = "bar",
  initialChartData,
  initialEmbedUrl = "",
  initialEmbedType = "youtube",
}: MediaInsertDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Image state
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageAlt, setImageAlt] = useState(initialImageAlt);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  
  // Chart state
  const [chartType, setChartType] = useState(initialChartType);
  const [chartData, setChartData] = useState(initialChartData ? JSON.stringify(initialChartData, null, 2) : "");
  
  // Embed state
  const [embedUrl, setEmbedUrl] = useState(initialEmbedUrl);
  const [embedType, setEmbedType] = useState(initialEmbedType);

  const handleInsert = () => {
    if (activeTab === "image" && imageUrl) {
      onInsertImage(imageUrl, imageAlt);
      setImageUrl("");
      setImageAlt("");
    } else if (activeTab === "chart" && chartData) {
      try {
        const data = JSON.parse(chartData);
        onInsertChart(chartType, data);
        setChartData("");
      } catch (e) {
        alert("Dữ liệu chart không hợp lệ. Vui lòng nhập JSON đúng định dạng.");
        return;
      }
    } else if (activeTab === "embed" && embedUrl) {
      onInsertEmbed(embedUrl, embedType);
      setEmbedUrl("");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chèn media</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="image" className="gap-2">
              <Image className="w-4 h-4" />
              Hình ảnh
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Biểu đồ
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-2">
              <Link2 className="w-4 h-4" />
              Embed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL hình ảnh</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unsplash-query">Tìm ảnh từ Unsplash</Label>
              <div className="flex gap-2">
                <Input
                  id="unsplash-query"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // TODO: Integrate with unsplash_tool
                      // For now, create a demo URL
                      setImageUrl(`https://source.unsplash.com/800x600/?${encodeURIComponent(unsplashQuery)}`);
                      setImageAlt(unsplashQuery);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // TODO: Integrate with unsplash_tool
                    // For now, create a demo URL
                    setImageUrl(`https://source.unsplash.com/800x600/?${encodeURIComponent(unsplashQuery)}`);
                    setImageAlt(unsplashQuery);
                  }}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nhấn Enter hoặc click nút tìm kiếm để lấy ảnh từ Unsplash
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-alt">Mô tả (tùy chọn)</Label>
              <Input
                id="image-alt"
                placeholder="Mô tả hình ảnh"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chart-type">Loại biểu đồ</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger id="chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Cột (Bar)</SelectItem>
                  <SelectItem value="line">Đường (Line)</SelectItem>
                  <SelectItem value="pie">Tròn (Pie)</SelectItem>
                  <SelectItem value="area">Vùng (Area)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chart-data">Dữ liệu (JSON)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const sampleData = [
                      { name: "Tháng 1", value: 400 },
                      { name: "Tháng 2", value: 300 },
                      { name: "Tháng 3", value: 600 },
                      { name: "Tháng 4", value: 800 },
                      { name: "Tháng 5", value: 500 },
                      { name: "Tháng 6", value: 700 }
                    ];
                    setChartData(JSON.stringify(sampleData, null, 2));
                  }}
                  className="h-7 text-xs"
                >
                  Sử dụng mẫu
                </Button>
              </div>
              <textarea
                id="chart-data"
                className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                placeholder={`[\n  { "name": "Tháng 1", "value": 100 },\n  { "name": "Tháng 2", "value": 200 }\n]`}
                value={chartData}
                onChange={(e) => setChartData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dữ liệu dạng JSON array. Mỗi object cần có "name" và "value"
              </p>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embed-type">Loại embed</Label>
              <Select value={embedType} onValueChange={setEmbedType}>
                <SelectTrigger id="embed-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="iframe">iFrame tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="embed-url">URL</Label>
              <Input
                id="embed-url"
                placeholder="https://youtube.com/watch?v=..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {embedType === "youtube" && "Nhập URL video YouTube"}
                {embedType === "twitter" && "Nhập URL tweet"}
                {embedType === "iframe" && "Nhập URL bất kỳ để embed"}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleInsert}>
            Chèn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
