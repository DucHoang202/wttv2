import { useState, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EditorBlock } from "./editor/EditorBlock";
import { BlockMenu } from "./editor/BlockMenu";
import { AIEditMenu } from "./editor/AIEditMenu";
import { FloatingToolbar } from "./editor/FloatingToolbar";
import { MediaInsertDialog } from "./editor/MediaInsertDialog";
import { StyleControlPanel } from "./StyleControlPanel";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ContentBlock, BlockType, StyleControls } from "../types";
import { Plus } from "lucide-react";
//import { logEvent } from "../lib/telemetry";

interface NotionStyleEditorProps {
  content: ContentBlock[];
  onGetData?: (getData: () => ContentBlock[]) => void;
  onContentChange?: (content: ContentBlock[]) => void;
  onConfirm?: () => void;
  styleControls?: StyleControls;
  onStyleChange?: (controls: StyleControls) => void;
}

export function NotionStyleEditor({
  content: initialContent,
  onGetData,
  onContentChange,
  onConfirm,
  styleControls = { tone: "professional", length: "medium", complexity: "moderate", language: "vi" },
  onStyleChange,
}: NotionStyleEditorProps) {
  // Initialize with title and sapo if empty
  const initializeBlocks = () => {
    if (initialContent.length > 0) {
      return initialContent;
    }
    return [
      { id: "title-block", type: "heading1" as BlockType, text: "", aiGenerated: false, meta: { isTitle: true } },
      { id: "sapo-block", type: "paragraph" as BlockType, text: "", aiGenerated: false, meta: { isSapo: true } },
      { id: generateId(), type: "paragraph" as BlockType, text: "", aiGenerated: false }
    ];
  };

  const [blocks, setBlocks] = useState<ContentBlock[]>(initializeBlocks());
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<{ blockId: string; query: string } | null>(null);
  const [showAIMenu, setShowAIMenu] = useState<string | null>(null);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [pendingMediaBlockId, setPendingMediaBlockId] = useState<string | null>(null);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);

  // Expose getData function to parent
  // Run on mount to set initial ref
  useEffect(() => {
    if (onGetData) {
      onGetData(() => blocks);
    }
  }, []);

  // Update ref whenever blocks change
  useEffect(() => {
    if (onGetData) {
      onGetData(() => blocks);
    }
  }, [blocks]);

  // Separate title, sapo, and content blocks
  const titleBlock = blocks.find(b => b.meta?.isTitle) || blocks[0];
  const sapoBlock = blocks.find(b => b.meta?.isSapo) || blocks[1];
  const contentBlocks = blocks.filter(b => !b.meta?.isTitle && !b.meta?.isSapo);

  function generateId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  const handleBlockChange = (blockId: string, text: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, text, aiGenerated: false } : block
    ));

    // Check for slash command
    if (text.startsWith("/")) {
      setShowBlockMenu({ blockId, query: text.substring(1) });
    } else {
      setShowBlockMenu(null);
    }

    console.log("edit_block", { block_id: blockId });
  };

  const handleBlockTypeChange = (blockId: string, type: BlockType) => {
    // For media types, open dialog instead of directly changing type
    if (type === "image" || type === "chart" || type === "embed") {
      setPendingMediaBlockId(blockId);
      setShowMediaDialog(true);
      setShowBlockMenu(null);
      return;
    }

    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, type } : block
    ));
    setShowBlockMenu(null);
    console.log("change_block_type", { block_id: blockId, type });
  };

  const handleInsertImage = (url: string, alt?: string) => {
    if (pendingMediaBlockId) {
      setBlocks(blocks.map(block =>
        block.id === pendingMediaBlockId
          ? { ...block, type: "image", text: "", meta: { url, alt } }
          : block
      ));
      setPendingMediaBlockId(null);
      console.log("insert_image", { block_id: pendingMediaBlockId });
    }
  };

  const handleInsertChart = (chartType: string, data: any) => {
    if (pendingMediaBlockId) {
      setBlocks(blocks.map(block =>
        block.id === pendingMediaBlockId
          ? { ...block, type: "chart", text: "", meta: { chartType, data } }
          : block
      ));
      setPendingMediaBlockId(null);
      console.log("insert_chart", { block_id: pendingMediaBlockId, chart_type: chartType });
    }
  };

  const handleInsertEmbed = (url: string, embedType: string) => {
    if (pendingMediaBlockId) {
      setBlocks(blocks.map(block =>
        block.id === pendingMediaBlockId
          ? { ...block, type: "embed", text: "", meta: { url, embedType } }
          : block
      ));
      setPendingMediaBlockId(null);
      console.log("insert_embed", { block_id: pendingMediaBlockId, embed_type: embedType });
    }
  };

  const handleAddBlock = (afterId: string, type: BlockType = "paragraph") => {
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      text: "",
      aiGenerated: false
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);

    // Focus new block
    setTimeout(() => setFocusedBlock(newBlock.id), 0);
    console.log("add_block", { type });
  };

  const handleDeleteBlock = (blockId: string) => {
    // Don't allow deleting title or sapo
    const block = blocks.find(b => b.id === blockId);
    if (block?.meta?.isTitle || block?.meta?.isSapo) {
      return;
    }

    if (contentBlocks.length === 1) {
      // Don't delete the last content block, just clear it
      setBlocks(blocks.map(b =>
        b.id === blockId ? { ...b, text: "" } : b
      ));
    } else {
      setBlocks(blocks.filter(b => b.id !== blockId));
    }
    console.log("delete_block", { block_id: blockId });
  };

  const handleMoveBlock = (dragIndex: number, hoverIndex: number) => {
    // Only move content blocks (not title/sapo)
    const dragBlock = contentBlocks[dragIndex];
    const newContentBlocks = [...contentBlocks];
    newContentBlocks.splice(dragIndex, 1);
    newContentBlocks.splice(hoverIndex, 0, dragBlock);

    // Reconstruct full blocks array with title and sapo at the top
    const newBlocks = [titleBlock, sapoBlock, ...newContentBlocks];
    setBlocks(newBlocks);
    console.log("move_block", { from: dragIndex, to: hoverIndex });
  };

  const handleDuplicateBlock = (blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    const block = blocks[index];
    const newBlock: ContentBlock = {
      ...block,
      id: generateId()
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    console.log("duplicate_block", { block_id: blockId });
  };

  const handleAIEdit = async (blockId: string, action: string, prompt?: string) => {
    console.log(`AI Edit: ${action} for block ${blockId}`, prompt);

    // Simulate AI processing
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    let newText = block.text;

    switch (action) {
      case "improve":
        newText = `[AI-improved] ${block.text}`;
        break;
      case "shorten":
        newText = block.text.substring(0, Math.floor(block.text.length * 0.7));
        break;
      case "expand":
        newText = `${block.text} [AI-expanded with additional context and details]`;
        break;
      case "rephrase":
        newText = `[AI-rephrased] ${block.text}`;
        break;
      case "custom":
        newText = `[AI: ${prompt}] ${block.text}`;
        break;
    }

    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, text: newText, aiGenerated: true } : b
    ));

    setShowAIMenu(null);
    console.log("ai_edit", { block_id: blockId, action });
  };

  const handleAcceptAI = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, aiGenerated: false } : b
    ));
    console.log("accept_ai_block", { block_id: blockId });
  };

  const handleApplyStyleControls = async () => {
    setIsApplyingStyle(true);
    console.log("apply_style_controls", { controls: styleControls });

    // Simulate AI adjusting content based on style controls
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark all content blocks as AI-generated to show they've been adjusted
    setBlocks(blocks.map(b => ({
      ...b,
      aiGenerated: !b.meta?.isTitle && !b.meta?.isSapo, // Don't mark title/sapo as AI generated
      text: b.text // In real app, AI would adjust the text here
    })));

    setIsApplyingStyle(false);

    if (onContentChange) {
      onContentChange(blocks);
    }
  };

  const handleKeyDown = (blockId: string, e: React.KeyboardEvent) => {
    const index = blocks.findIndex(b => b.id === blockId);
    const block = blocks[index];

    // Don't allow deleting title or sapo
    const isFixedBlock = block.meta?.isTitle || block.meta?.isSapo;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddBlock(blockId);
    } else if (e.key === "Backspace" && block.text === "" && !isFixedBlock && contentBlocks.length > 1) {
      e.preventDefault();
      handleDeleteBlock(blockId);
      // Focus previous block
      if (index > 0) {
        setFocusedBlock(blocks[index - 1].id);
      }
    } else if (e.key === "ArrowUp" && index > 0) {
      // Move to previous block
      const selection = window.getSelection();
      if (selection && selection.anchorOffset === 0) {
        e.preventDefault();
        setFocusedBlock(blocks[index - 1].id);
      }
    } else if (e.key === "ArrowDown" && index < blocks.length - 1) {
      // Move to next block
      const selection = window.getSelection();
      const textLength = block.text.length;
      if (selection && selection.anchorOffset === textLength) {
        e.preventDefault();
        setFocusedBlock(blocks[index + 1].id);
      }
    }
  };

  const stats = {
    blocks: contentBlocks.length,
    words: blocks.reduce((acc, block) => acc + block.text.split(/\s+/).filter(w => w).length, 0),
    characters: blocks.reduce((acc, block) => acc + block.text.length, 0),
    aiGenerated: blocks.filter(b => b.aiGenerated).length
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col lg:flex-row gap-6 py-[24px] p-[0px]">
        {/* Main editor */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="mb-2 title-font" style={{ fontFamily: 'SVN Apparat, Inter Display, system-ui', fontWeight: 500 }}>Soạn nội dung</h2>
            <p className="text-muted-foreground">
              Nhấn "/" để mở menu lệnh, kéo thả để sắp xếp, bôi đen text để mở toolbar
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Title & Sapo - Outside the editor box */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <EditorBlock
                  key={titleBlock.id}
                  block={titleBlock}
                  index={-1}
                  isFocused={focusedBlock === titleBlock.id}
                  isTitle={true}
                  isDraggable={false}
                  onFocus={() => setFocusedBlock(titleBlock.id)}
                  onChange={(text) => handleBlockChange(titleBlock.id, text)}
                  onKeyDown={(e) => handleKeyDown(titleBlock.id, e)}
                  onDelete={() => { }}
                  onDuplicate={() => { }}
                  onMove={handleMoveBlock}
                  onAddBlock={() => handleAddBlock(titleBlock.id)}
                  onTypeChange={(type) => handleBlockTypeChange(titleBlock.id, type)}
                  onAIEdit={() => setShowAIMenu(titleBlock.id)}
                  onAcceptAI={() => handleAcceptAI(titleBlock.id)}
                  onEditMedia={() => { }}
                />
              </div>

              {/* Sapo */}
              <div>
                <EditorBlock
                  key={sapoBlock.id}
                  block={sapoBlock}
                  index={-1}
                  isFocused={focusedBlock === sapoBlock.id}
                  isSapo={true}
                  isDraggable={false}
                  onFocus={() => setFocusedBlock(sapoBlock.id)}
                  onChange={(text) => handleBlockChange(sapoBlock.id, text)}
                  onKeyDown={(e) => handleKeyDown(sapoBlock.id, e)}
                  onDelete={() => { }}
                  onDuplicate={() => { }}
                  onMove={handleMoveBlock}
                  onAddBlock={() => handleAddBlock(sapoBlock.id)}
                  onTypeChange={(type) => handleBlockTypeChange(sapoBlock.id, type)}
                  onAIEdit={() => setShowAIMenu(sapoBlock.id)}
                  onAcceptAI={() => handleAcceptAI(sapoBlock.id)}
                  onEditMedia={() => { }}
                />
              </div>
            </div>

            {/* Content blocks - In white editor box */}
            <div className="bg-[rgb(255,255,255)] rounded-lg border border-border p-[24px]">
              <div className="space-y-1">
                {contentBlocks.map((block, index) => (
                  <EditorBlock
                    key={block.id}
                    block={block}
                    index={index}
                    isFocused={focusedBlock === block.id}
                    isDraggable={true}
                    onFocus={() => setFocusedBlock(block.id)}
                    onChange={(text) => handleBlockChange(block.id, text)}
                    onKeyDown={(e) => handleKeyDown(block.id, e)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onDuplicate={() => handleDuplicateBlock(block.id)}
                    onMove={handleMoveBlock}
                    onAddBlock={() => handleAddBlock(block.id)}
                    onTypeChange={(type) => handleBlockTypeChange(block.id, type)}
                    onAIEdit={() => setShowAIMenu(block.id)}
                    onAcceptAI={() => handleAcceptAI(block.id)}
                    onEditMedia={() => {
                      setPendingMediaBlockId(block.id);
                      setShowMediaDialog(true);
                    }}
                  />
                ))}

                {/* Add block button at the end */}
                <button
                  onClick={() => handleAddBlock(contentBlocks[contentBlocks.length - 1]?.id || sapoBlock.id)}
                  className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm block
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[350px] flex-shrink-0">
          <Card className="p-4 sticky top-20">
            <div className="text-sm mb-4">Công cụ</div>

            <div className="space-y-6">
              {/* Style Controls */}
              {onStyleChange && (
                <div className="pb-6 border-b">
                  <StyleControlPanel
                    controls={styleControls}
                    onChange={onStyleChange}
                    onApply={handleApplyStyleControls}
                    isApplying={isApplyingStyle}
                  />
                </div>
              )}

              {/* Stats */}
              <div>
                <div className="text-xs mb-2 text-muted-foreground">Thống kê</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Blocks:</span>
                    <span>{stats.blocks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Từ:</span>
                    <span>{stats.words}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ký tự:</span>
                    <span>{stats.characters}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="pt-3 border-t">
                <div className="text-xs mb-2 text-muted-foreground">Phím tắt</div>
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <div><kbd className="text-xs">/</kbd> Menu</div>
                  <div><kbd className="text-xs">Enter</kbd> Block mới</div>
                  <div><kbd className="text-xs">⌫</kbd> Xóa</div>
                </div>
              </div>
            </div>
          </Card>
        </div>


      </div>

      {/* Floating toolbar for text selection */}
      <FloatingToolbar onAIEdit={() => {
        // Get the currently focused block and open AI menu
        if (focusedBlock) {
          setShowAIMenu(focusedBlock);
        }
      }} />

      {/* Block menu */}
      {showBlockMenu && (
        <BlockMenu
          query={showBlockMenu.query}
          onSelect={(type) => {
            handleBlockTypeChange(showBlockMenu.blockId, type);
            handleBlockChange(showBlockMenu.blockId, "");
          }}
          onClose={() => setShowBlockMenu(null)}
        />
      )}

      {/* AI Edit menu */}
      {showAIMenu && (
        <AIEditMenu
          blockId={showAIMenu}
          onAction={(action, prompt) => handleAIEdit(showAIMenu, action, prompt)}
          onClose={() => setShowAIMenu(null)}
        />
      )}

      {/* Media Insert Dialog */}
      {pendingMediaBlockId && (() => {
        const block = blocks.find(b => b.id === pendingMediaBlockId);
        return (
          <MediaInsertDialog
            isOpen={showMediaDialog}
            onClose={() => {
              setShowMediaDialog(false);
              setPendingMediaBlockId(null);
            }}
            onInsertImage={handleInsertImage}
            onInsertChart={handleInsertChart}
            onInsertEmbed={handleInsertEmbed}
            initialTab={block?.type === "image" ? "image" : block?.type === "chart" ? "chart" : block?.type === "embed" ? "embed" : "image"}
            initialImageUrl={block?.meta?.url}
            initialImageAlt={block?.meta?.alt}
            initialChartType={block?.meta?.chartType}
            initialChartData={block?.meta?.data}
            initialEmbedUrl={block?.meta?.url}
            initialEmbedType={block?.meta?.embedType}
          />
        );
      })()}
    </DndProvider>
  );
}
