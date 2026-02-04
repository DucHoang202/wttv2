// Core types for AI-Orchestrated Newsroom

export type ContentType = "news" | "profile" | "opinion" | "digest" | "marketing" | "seo";
export type ArticleStatus = "draft" | "editing" | "optimized" | "published";
export type StepState = "idle" | "running" | "awaiting_human" | "completed" | "failed";

// FLOW V2: 7 standard steps
export type StepId = 
  | "topic_selection"       // Step 2: Chọn chủ đề/đối tượng/đề tài
  | "ai_research"           // Step 3: AI Research & Summary
  | "angle_selection"       // Step 4: Gợi ý hướng tiếp cận
  | "content_generation"    // Step 5: Sinh nội dung & Biên tập
  | "editorial_review"      // Step 6: Biên tập & Kiểm duyệt
  | "publish_optimize";     // Step 7: Xuất bản & Tối ưu

export interface WorkflowStep {
  id: StepId;
  label: string;
  required: boolean;
  agent: string;
  state: StepState;
  data: any;
}

export type BlockType = 
  | "heading1" 
  | "heading2" 
  | "heading3" 
  | "paragraph" 
  | "bulleted-list"
  | "numbered-list"
  | "quote" 
  | "code"
  | "divider"
  | "image" 
  | "chart"
  | "embed";

export interface ContentBlock {
  id: string;
  type: BlockType;
  text: string;
  meta?: Record<string, any>;
  aiGenerated?: boolean;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  timestamp?: string;
  content?: string;
  selected?: boolean;
}

export interface Quote {
  id: string;
  speaker: string;
  text: string;
  timestamp?: string;
  source_id?: string;
  selected?: boolean;
}

export interface EditTrace {
  block_id: string;
  before: string;
  after: string;
  by: string;
  at: string;
}

export interface SEOData {
  title_variants: string[];
  meta_description: string;
  slug: string;
  tags: string[];
}

// Topic/Subject data for Step 2
export interface TopicData {
  name: string;
  type: "person" | "event" | "topic" | "product" | "campaign" | "keyword";
  description?: string;
  // Marketing specific
  marketingObjectType?: "product" | "kol" | "campaign";
  brandTone?: "friendly" | "premium" | "inspiring" | "expert";
  // SEO specific
  seoObjective?: "website" | "social" | "ai_search";
  mainKeyword?: string;
  keywordCluster?: string[];
  searchIntent?: "informational" | "transactional" | "comparative" | "conversational";
}

// Angle option for Step 4
export interface AngleOption {
  id: string;
  label: string;
  description: string;
  focus: string;
}

// Summary data for Step 3
export interface ObjectSummary {
  topic: TopicData;
  summary: string;
  key_points: string[];
  sources: Source[];
}

// Style controls for Step 5
export interface StyleControls {
  tone: "formal" | "casual" | "professional" | "friendly";
  length: "short" | "medium" | "long";
  complexity: "simple" | "moderate" | "advanced";
  language: "vi" | "en";
}

// Editorial check result for Step 6
export interface EditorialCheck {
  spelling_grammar: { passed: boolean; issues: string[] };
  fact_check: { passed: boolean; issues: string[] };
  bias_check: { passed: boolean; issues: string[] };
  dna_alignment: { passed: boolean; issues: string[] };
}

export interface Article {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  status: ArticleStatus;
  current_step: StepId;
  
  // Step 2 data
  topic?: TopicData;
  
  // Step 3 data
  object_summary?: ObjectSummary;
  angle_options?: AngleOption[];
  // Step 4 data
  selected_angle?: AngleOption;
  
  // Step 5 data
  content: ContentBlock[];
  style_controls?: StyleControls;
  
  // Step 6 data
  editorial_check?: EditorialCheck;
  
  // Step 7 data
  seo: SEOData;
  
  // Legacy/supporting data
  sources: Source[];
  quotes: Quote[];
  edit_trace: EditTrace[];
}

export interface WorkflowConfig {
  article_id: string;
  type: ContentType;
  status: ArticleStatus;
  current_step: StepId;
  steps: WorkflowStep[];
  session: {
    user_id: string;
    team_id: string;
    created_at: string;
  };
}

export interface StepRun {
  article_id: string;
  step: StepId;
  agent: string;
  state: StepState;
  input_context: any;
  output_payload: any;
  errors: string[];
}

export interface ContentTypeOption {
  type: ContentType;
  label: string;
  description: string;
  when_to_use: string;
  example_output: string;
  workflow: StepId[];
}
