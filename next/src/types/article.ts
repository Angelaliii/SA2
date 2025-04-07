// 文章相關的類型定義
export interface ArticleFormData {
  title: string;
  content: string;
  location: string;
  tags: string[];
  postType: string;
  visibility: string;
  cooperationType: string;
  cooperationDeadline: Date | null;
  cooperationDeadlineStr: string;
  budgetMin: string;
  budgetMax: string;
  eventDate: Date | null;
  eventDateStr: string;
}

export interface ArticleFormErrors {
  [key: string]: string;
}

export interface ArticleFormProps {
  // 表單資料
  data: ArticleFormData;
  errors: ArticleFormErrors;

  // UI 狀態
  isDraft: boolean;
  loading: boolean;
  currentDraftId?: string;
  lastSaved: string | null;

  // 事件處理函數
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPostTypeChange: (value: string) => void;
  onTagsChange: (values: string[]) => void;
  onVisibilityChange: (value: string) => void;
  onCooperationTypeChange: (value: string) => void;
  onCooperationDeadlineChange: (value: string) => void;
  onBudgetMinChange: (value: string) => void;
  onBudgetMaxChange: (value: string) => void;
  onEventDateChange: (value: string) => void;

  // 動作函數
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onDeleteDraft: () => void;
  onResetForm: () => void;
  onPreview: () => void;
}

export interface ArticlePreviewProps {
  // 表單資料
  data: ArticleFormData;

  // UI 狀態
  loading: boolean;

  // 操作函數
  onBack: () => void;
  onPublish: () => Promise<void>;
}

export interface DraftManagerProps {
  open: boolean;
  onClose: () => void;
  drafts: any[];
  loading: boolean;
  onLoadDraft: (draftId: string) => Promise<void>;
  onDeleteDraft: (draftId: string) => void;
}

export interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// 草稿類型
export interface Draft {
  id: string;
  title: string;
  content: string;
  postType: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}
