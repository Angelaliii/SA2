// 文章表單自定義 Hook
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { visibilityOptions } from "../constants/articleOptions";
import { auth } from "../firebase/config";
import { postService } from "../firebase/services";
import { ArticleFormData, ArticleFormErrors, Draft } from "../types/article";
import { formatDate, parseDate } from "../utils/dateUtils";

/**
 * 文章表單狀態與邏輯的自定義Hook
 * 負責處理文章編輯、草稿管理、表單驗證等功能
 */
export default function useArticleForm() {
  const router = useRouter();

  // ========== 基本資料狀態 ==========
  // 文章基本資訊
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [postType, setPostType] = useState("");
  const [visibility, setVisibility] = useState(visibilityOptions[0]);

  // UI狀態控制
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isUnSaved, setIsUnSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<ArticleFormErrors>({});

  // 通知訊息控制
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // ========== 合作需求相關狀態 ==========
  // 合作需求詳情
  const [cooperationDeadline, setCooperationDeadline] = useState<Date | null>(
    null
  );
  const [cooperationType, setCooperationType] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);

  // 日期輸入用字串格式
  const [cooperationDeadlineStr, setCooperationDeadlineStr] = useState("");
  const [eventDateStr, setEventDateStr] = useState("");

  // ========== 草稿相關狀態 ==========
  const [isDraft, setIsDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(
    undefined
  );
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== 副作用處理 ====================

  // 同步日期對象和字符串
  useEffect(() => {
    // 當Date物件變化時，更新對應的字符串
    if (cooperationDeadline) {
      setCooperationDeadlineStr(formatDate(cooperationDeadline));
    }
    if (eventDate) {
      setEventDateStr(formatDate(eventDate));
    }
  }, [cooperationDeadline, eventDate]);

  // 更新日期對象當字符串改變
  useEffect(() => {
    setCooperationDeadline(parseDate(cooperationDeadlineStr));
  }, [cooperationDeadlineStr]);

  useEffect(() => {
    setEventDate(parseDate(eventDateStr));
  }, [eventDateStr]);

  // ========== 表單變更監控 ==========

  // 檢查表單是否有變更
  const checkFormChanged = () => {
    // 任何主要欄位有值，表示表單已變更
    if (title || content || location || tags.length > 0 || postType) {
      setIsUnSaved(true);
    } else {
      setIsUnSaved(false);
    }
  };

  // 監聽表單變更
  useEffect(() => {
    checkFormChanged();
  }, [title, content, location, tags, postType]);

  // ========== 自動保存功能 ==========
  useEffect(() => {
    // 如果有未保存的變更且不在預覽模式，開始自動保存計時
    if (isUnSaved && !previewMode) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, 60000); // 每60秒自動保存
    }

    // 清理計時器
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isUnSaved, title, content, tags, postType, location]);

  // ==================== 表單操作函數 ====================

  /**
   * 驗證表單資料
   * @returns 表單是否有效
   */
  const validateForm = () => {
    const newErrors: ArticleFormErrors = {};

    // 基本必填欄位驗證
    validateBasicFields(newErrors);

    // 合作需求特有欄位的驗證
    if (postType === "企業合作需求" || postType === "社團活動合作") {
      validateCooperationFields(newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // 沒有錯誤表示表單有效
  };

  /**
   * 驗證基本必填欄位
   */
  const validateBasicFields = (errors: ArticleFormErrors) => {
    if (!title) errors.title = "請輸入標題";
    if (!content) errors.content = "請輸入內容";
    if (!postType) errors.postType = "請選擇文章類型";
  };

  /**
   * 驗證合作類型特有欄位
   */
  const validateCooperationFields = (errors: ArticleFormErrors) => {
    // 合作期限和類型是合作需求必填的
    if (!cooperationDeadlineStr) errors.cooperationDeadline = "請設定合作期限";
    if (!cooperationType) errors.cooperationType = "請選擇合作類型";

    // 企業合作需求特有驗證
    if (postType === "企業合作需求") {
      validateBudget(errors);
    }

    // 社團活動合作特有驗證
    if (postType === "社團活動合作" && !eventDateStr) {
      errors.eventDate = "請設定活動日期";
    }
  };

  /**
   * 驗證預算欄位
   */
  const validateBudget = (errors: ArticleFormErrors) => {
    if (!budgetMin && !budgetMax) {
      errors.budget = "請填寫預算範圍";
    } else if (Number(budgetMin) > Number(budgetMax) && budgetMax) {
      errors.budget = "最低預算不應高於最高預算";
    }
  };

  /**
   * 重置表單所有欄位
   */
  const resetForm = () => {
    // 清空所有表單資料
    setTitle("");
    setContent("");
    setLocation("");
    setPostType("");
    setTags([]);
    setCooperationDeadline(null);
    setCooperationDeadlineStr("");
    setCooperationType("");
    setBudgetMin("");
    setBudgetMax("");
    setEventDate(null);
    setEventDateStr("");
    setVisibility(visibilityOptions[0]);

    // 重設草稿相關狀態
    setCurrentDraftId(undefined);
    setIsDraft(false);
  };

  /**
   * 切換預覽模式
   */
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // ==================== 草稿相關函數 ====================

  /**
   * 載入用戶所有草稿
   */
  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      // 檢查用戶是否登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入以查看草稿");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoadingDrafts(false);
        return;
      }

      // 從資料庫獲取使用者的草稿
      const userDrafts = await postService.getUserDrafts(currentUser.uid);
      // 確保所有草稿都有 id 屬性，並進行類型轉換
      const draftsWithId = userDrafts.filter((draft) => draft.id) as Draft[];
      setDrafts(draftsWithId);
      setOpenDraftsDialog(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  /**
   * 載入特定草稿
   * @param draftId 草稿ID
   */
  const loadDraft = async (draftId: string) => {
    try {
      // 從資料庫獲取草稿
      const draft = await postService.getPostById(draftId);
      if (!draft) {
        throw new Error("找不到指定草稿");
      }

      // 填充表單基本資料
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setPostType(draft.postType || "");
      setCurrentDraftId(draftId);

      // 設置其他字段
      if (draft.tags) setTags(draft.tags);
      if (draft.location) setLocation(draft.location);
      if (draft.cooperationType) setCooperationType(draft.cooperationType);

      // 日期相關處理
      if (draft.cooperationDeadline) {
        const date = new Date(draft.cooperationDeadline);
        setCooperationDeadline(date);
        setCooperationDeadlineStr(formatDate(date));
      }

      // 預算處理
      if (draft.budget) {
        setBudgetMin(draft.budget.min.toString());
        setBudgetMax(draft.budget.max.toString());
      }

      // 活動日期處理
      if (draft.eventDate) {
        const date = new Date(draft.eventDate);
        setEventDate(date);
        setEventDateStr(formatDate(date));
      }

      // 可見性設置
      if (draft.visibility) setVisibility(draft.visibility);

      // 更新UI狀態
      setSnackbarMessage("草稿已載入");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDraftsDialog(false);
      setIsDraft(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  /**
   * 確認刪除草稿
   * @param draftId 草稿ID
   */
  const confirmDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setOpenDeleteDialog(true);
  };

  /**
   * 刪除草稿
   * @param draftId 要刪除的草稿ID
   */
  const deleteDraft = async (draftId: string) => {
    try {
      // 從資料庫刪除草稿
      await postService.deletePost(draftId);

      // 更新本地草稿列表
      setDrafts(drafts.filter((draft) => draft.id !== draftId));

      // 如果刪除的是當前正在編輯的草稿，則重置表單
      if (currentDraftId === draftId) {
        resetForm();
      }

      // 更新UI通知
      setSnackbarMessage("草稿已刪除");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDeleteDialog(false);
      setDraftToDelete(null);
    } catch (error) {
      console.error("刪除草稿時出錯:", error);
      setSnackbarMessage("無法刪除草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  /**
   * 儲存草稿
   */
  const handleSaveDraft = async () => {
    try {
      // 檢查用戶是否已登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      // 確保至少有標題
      if (!title.trim()) {
        setSnackbarMessage("草稿需要填寫標題");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      // 準備要儲存的草稿資料
      const draftData = {
        title, // 標題
        content: content || "", // 內容
        location: location || "", // 發布位置
        postType: postType || "一般文章", // 文章類型
        tags: tags || [], // 標籤
        authorId: currentUser.uid, // 作者ID

        // 日期轉換為ISO字串，若無則為null
        cooperationDeadline: cooperationDeadline
          ? cooperationDeadline.toISOString()
          : null,

        cooperationType: cooperationType || "", // 合作類型

        // 預算處理，如有值則轉為數字
        budget:
          budgetMin || budgetMax
            ? { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 }
            : null,

        // 活動日期，若有則轉為ISO字串
        eventDate: eventDate ? eventDate.toISOString() : null,
        visibility: visibility || "公開", // 可見性設定
        isDraft: true, // 標記為草稿
      };

      // 儲存草稿到資料庫
      const result = await postService.saveDraft(draftData, currentDraftId);

      if (result.success) {
        // 如果是新草稿，設置當前草稿ID
        if (result.id && !currentDraftId) {
          setCurrentDraftId(result.id);
        }

        // 更新保存時間顯示
        const now = new Date();
        setLastSaved(
          `上次保存時間：${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );

        // 更新UI狀態
        setSnackbarMessage("草稿已保存");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setIsUnSaved(false);
        setIsDraft(true);
      } else {
        throw new Error("儲存草稿失敗");
      }
    } catch (error) {
      console.error("儲存草稿時出錯:", error);
      setSnackbarMessage("儲存草稿失敗");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  /**
   * 發布文章或將草稿轉為正式文章
   */
  const handlePublish = async () => {
    // 先進行表單驗證
    if (!validateForm()) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      // 檢查用戶是否已登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showError("請先登入");
        return;
      }

      // 處理發布操作並獲取結果
      const result = await publishPost(currentUser.uid);

      // 處理發布結果
      if (result.success) {
        handleSuccessfulPublish();
      } else {
        throw new Error("發布失敗");
      }
    } catch (error) {
      console.error("發布文章時出錯:", error);
      setSnackbarMessage("發布失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 顯示錯誤消息
   */
  const showError = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
    setLoading(false);
  };

  /**
   * 處理發布文章的具體邏輯
   */
  const publishPost = async (userId: string) => {
    // 如果是現有草稿，則將其發布
    if (currentDraftId) {
      return await postService.publishDraft(currentDraftId);
    }

    // 創建新文章資料
    const postData = createPostData(userId);

    // 創建新的正式文章
    return await postService.createPost(postData);
  };

  /**
   * 建立發布文章所需的資料物件
   */
  const createPostData = (userId: string) => {
    return {
      title, // 標題
      content, // 內容
      location, // 發布位置
      postType, // 文章類型
      tags, // 標籤
      authorId: userId, // 作者ID

      // 合作期限
      cooperationDeadline: cooperationDeadline
        ? cooperationDeadline.toISOString()
        : null,

      // 僅在合作類型文章中包含合作類型
      cooperationType: postType.includes("合作") ? cooperationType : null,

      // 預算（僅企業合作需求）
      budget:
        postType === "企業合作需求" && (budgetMin || budgetMax)
          ? { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 }
          : null,

      // 活動日期（僅社團活動合作）
      eventDate:
        postType === "社團活動合作" && eventDate
          ? eventDate.toISOString()
          : null,

      visibility, // 可見性
      isDraft: false, // 非草稿
      viewCount: 0, // 初始化觀看次數
      interactionCount: 0, // 初始化互動次數
    };
  };

  /**
   * 處理發布成功後的操作
   */
  const handleSuccessfulPublish = () => {
    setSnackbarMessage("文章發布成功");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
    setIsUnSaved(false);

    // 重設表單
    resetForm();

    // 導航到首頁（文章列表頁面）
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  // 彙整表單資料為一個物件
  const formData: ArticleFormData = {
    title,
    content,
    location,
    tags,
    postType,
    visibility,
    cooperationType,
    cooperationDeadline,
    cooperationDeadlineStr,
    budgetMin,
    budgetMax,
    eventDate,
    eventDateStr,
  };

  // 返回所有資料和操作函數
  return {
    // 表單資料和狀態
    formData,
    errors,
    isDraft,
    loading,
    lastSaved,
    currentDraftId,
    previewMode,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,

    // 草稿相關
    drafts,
    openDraftsDialog,
    loadingDrafts,
    draftToDelete,
    openDeleteDialog,

    // setter 函數
    setTitle,
    setContent,
    setLocation,
    setTags,
    setPostType,
    setVisibility,
    setCooperationType,
    setCooperationDeadlineStr,
    setBudgetMin,
    setBudgetMax,
    setEventDateStr,

    // UI 控制函數
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    setPreviewMode,
    setOpenDraftsDialog,
    setOpenDeleteDialog,

    // 操作函數
    togglePreview,
    resetForm,
    loadDrafts,
    loadDraft,
    confirmDeleteDraft,
    deleteDraft,
    handleSaveDraft,
    handlePublish,
    validateForm,
  };
}
