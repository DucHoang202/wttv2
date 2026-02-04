import { Article, WorkflowConfig, StepId, ContentType, WorkflowStep } from "../types";
import { createMockArticle } from "../data/mockData";
import { WORKFLOW_STEPS } from "../data/workflows";

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
const articles = new Map<string, Article>();

export const mockApi = {
  // Create new article
  async createArticle(typeOrData: ContentType | Partial<Article>, title?: string): Promise<{ article_id: string; workflow_config: WorkflowConfig }> {
    await delay(300);
    
    let article: Article;
    let type: ContentType;

    // Check if it's demo data (object) or just type (string)
    if (typeof typeOrData === 'object') {
      // Demo data with full article
      const demoData = typeOrData as Partial<Article>;
      type = demoData.type!;
      article = createMockArticle(type);
      
      // Override with demo data
      Object.assign(article, demoData);
      
      // Set current step based on available data
      if (demoData.content && demoData.content.length > 0) {
        article.current_step = "editorial_review";
      } else if (demoData.selected_angle) {
        article.current_step = "content_generation";
      } else if (demoData.object_summary) {
        article.current_step = "angle_selection";
      } else if (demoData.topic) {
        article.current_step = "ai_research";
      }
    } else {
      // Normal flow: just content type
      type = typeOrData;
      article = createMockArticle(type);
      if (title) article.title = title;
    }
    
    articles.set(article.id, article);

    const workflowSteps = getWorkflowForType(type);
    
    const workflow_config: WorkflowConfig = {
      article_id: article.id,
      type,
      status: article.status || "draft",
      current_step: article.current_step || "topic_selection",
      steps: workflowSteps,
      session: {
        user_id: "U-123",
        team_id: "T-NEWS",
        created_at: new Date().toISOString()
      }
    };

    return { article_id: article.id, workflow_config };
  },

  // Get article by ID
  async getArticle(id: string): Promise<Article | null> {
    await delay(200);
    return articles.get(id) || null;
  },

  // Update article
  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    await delay(200);
    const article = articles.get(id);
    if (!article) throw new Error("Article not found");
    
    const updated = { ...article, ...updates };
    articles.set(id, updated);
    return updated;
  },

  // Run step
  async runStep(articleId: string, step: StepId, inputContext: any): Promise<any> {
    await delay(800);
    
    // Simulate AI processing
    const mockOutputs: Record<StepId, any> = {
      smart_brief: {
        suggestions: {
          angles: [
            "Phân tích tác động của chính sách tiền tệ đến thị trường chứng khoán",
            "So sánh xu hướng đầu tư nội địa và ngoại trong quý III",
            "Dự báo triển vọng thị trường 6 tháng cuối năm 2025"
          ],
          tone: "Khách quan, phân tích",
          audience: "Nhà đầu tư cá nhân",
          keywords: ["chứng khoán", "VN-Index", "FDI", "lãi suất"]
        }
      },
      research: {
        sources: [
          {
            id: "src-1",
            title: "Thị trường chứng khoán Việt Nam tăng trưởng 15% trong quý III/2025",
            url: "https://vnexpress.net/example",
            excerpt: "VN-Index đạt mốc 1,250 điểm, cao nhất trong 18 tháng qua...",
          }
        ]
      },
      writer: {
        content: [
          {
            id: "blk-1",
            type: "heading",
            text: inputContext.title || "Tiêu đề bài viết",
            aiGenerated: true
          },
          {
            id: "blk-2",
            type: "paragraph",
            text: "Đây là đoạn mở bài được AI tạo tự động dựa trên brief và nguồn nghiên cứu...",
            aiGenerated: true
          }
        ]
      }
    };

    return mockOutputs[step] || {};
  },

  // Confirm step
  async confirmStep(articleId: string, step: StepId, data: any): Promise<{ next_step: StepId | null; article: Article }> {
    await delay(300);
    
    const article = articles.get(articleId);
    if (!article) throw new Error("Article not found");

    // Update article with step data
    const updated = { ...article };
    
    // Move to next step
    const workflow = getWorkflowForType(article.type);
    const currentIndex = workflow.findIndex(s => s.id === step);
    const nextStep = currentIndex < workflow.length - 1 ? workflow[currentIndex + 1].id : null;
    
    if (nextStep) {
      updated.current_step = nextStep;
    }

    articles.set(articleId, updated);

    return { next_step: nextStep, article: updated };
  },

  // Publish article
  async publishArticle(articleId: string, seo: any, channels: string[]): Promise<{ status: string; url: string }> {
    await delay(500);
    
    const article = articles.get(articleId);
    if (!article) throw new Error("Article not found");

    article.status = "published";
    article.seo = { ...article.seo, ...seo };
    articles.set(articleId, article);

    return {
      status: "published",
      url: `https://example.com/${article.seo.slug}`
    };
  }
};

// Helper to get workflow steps for content type (FLOW V2)
function getWorkflowForType(type: ContentType): WorkflowStep[] {
  // FLOW V2: All content types follow same 7 steps
  const stepIds: StepId[] = [
    "topic_selection",
    "ai_research", 
    "angle_selection",
    "content_generation",
    "editorial_review",
    "publish_optimize"
  ];

  return stepIds.map(id => ({
    id,
    label: WORKFLOW_STEPS[id].label,
    required: true,
    agent: WORKFLOW_STEPS[id].agent,
    state: "idle" as const,
    data: {}
  }));
}
