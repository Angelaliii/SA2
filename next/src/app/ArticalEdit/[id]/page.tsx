"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { db } from "../../../firebase/config";

export default function EditArticalPage() {
  const { id } = useParams(); // 獲取 URL 中的需求文章 id
  const router = useRouter(); // 使用 useRouter 來進行頁面跳轉
  const auth = getAuth(); // 獲取 Firebase 認證
  const [artical, setArtical] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [demandDescription, setDemandDescription] = useState("");
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [cooperationReturn, setCooperationReturn] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [error, setError] = useState(""); // 用來顯示錯誤訊息
  const [success, setSuccess] = useState(false); // 用來顯示發布成功訊息
  // 新增的需求類型相關狀態
  const [demandType, setDemandType] = useState("");
  const [itemType, setItemType] = useState("");
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [moneyLowerLimit, setMoneyLowerLimit] = useState("");
  const [moneyUpperLimit, setMoneyUpperLimit] = useState("");
  const [speakerType, setSpeakerType] = useState("");
  const [eventNature, setEventNature] = useState("");
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [sponsorDeadline, setSponsorDeadline] = useState("");
  const [dateError, setDateError] = useState("");
  const [moneyError, setMoneyError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("需求文章 ID 無效");
      return;
    }

    const fetchArtical = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "posts", id as string); // 使用 doc() 時確保 id 是有效的
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const articalData = docSnap.data();
          setArtical(articalData);
          setTitle(articalData.title || "");
          setDemandDescription(articalData.demandDescription || "");
          setSelectedDemands(articalData.selectedDemands || []);
          setCooperationReturn(articalData.cooperationReturn ?? "");
          setEstimatedParticipants(articalData.estimatedParticipants ?? "");
          setEventDate(articalData.eventDate ?? "");
          setEventDescription(articalData.eventDescription ?? "");
          setDemandType(articalData.demandType ?? "");
          setItemType(articalData.itemType ?? "");
          setCustomItems(articalData.customItems ?? []);
          setMoneyLowerLimit(articalData.moneyLowerLimit ?? "");
          setMoneyUpperLimit(articalData.moneyUpperLimit ?? "");
          setSpeakerType(articalData.speakerType ?? "");
          setEventNature(articalData.eventNature ?? "");
          setFeedbackDetails(articalData.feedbackDetails ?? "");
          setSponsorDeadline(articalData.sponsorDeadline ?? "");

          // 檢查當前用戶是否是該需求文章的創建者
          const currentUser = auth.currentUser;
          if (currentUser && articalData.authorId !== currentUser.uid) {
            setError("您無權編輯此需求文章");
          }
        } else {
          setError("該需求文章不存在");
        }
      } catch (err) {
        console.error("錯誤:", err);
        setError("獲取需求文章資料失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchArtical();
  }, [id, auth]);

  // 處理日期變更時的驗證
  useEffect(() => {
    if (
      sponsorDeadline &&
      eventDate &&
      new Date(sponsorDeadline) > new Date(eventDate)
    ) {
      setDateError("贊助截止日期不能晚於活動日期");
    } else {
      setDateError("");
    }
  }, [sponsorDeadline, eventDate]);

  // 處理金額範圍的驗證
  useEffect(() => {
    if (
      moneyLowerLimit &&
      moneyUpperLimit &&
      Number(moneyLowerLimit) > Number(moneyUpperLimit)
    ) {
      setMoneyError("下限金額不能大於上限金額");
    } else {
      setMoneyError("");
    }
  }, [moneyLowerLimit, moneyUpperLimit]);

  const handleSave = async () => {
    if (!title || !demandDescription) {
      setError("請確保必填欄位都有填寫");
      return;
    }

    if (dateError) {
      setError(dateError);
      return;
    }

    if (moneyError) {
      setError(moneyError);
      return;
    }

    try {
      const docRef = doc(db, "posts", id as string);
      const updateData: any = {
        title,
        demandDescription,
        selectedDemands,
        cooperationReturn,
        estimatedParticipants,
        eventDate,
        eventDescription,
        eventNature,
        feedbackDetails,
        sponsorDeadline,
      };

      // 根據需求類型添加特定欄位
      if (demandType === "物資") {
        updateData.itemType = itemType;
        updateData.customItems = customItems;
      } else if (demandType === "金錢") {
        updateData.moneyLowerLimit = moneyLowerLimit;
        updateData.moneyUpperLimit = moneyUpperLimit;
      } else if (demandType === "講師") {
        updateData.speakerType = speakerType;
      }

      await updateDoc(docRef, updateData);
      setSuccess(true); // 成功後顯示成功訊息
      setTimeout(() => {
        router.push("/ArticalUser"); // 跳轉到我的需求文章頁面
      }, 1500);
    } catch (err) {
      console.error("更新需求文章資料時發生錯誤:", err);
      setError("更新需求文章資料失敗");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={50} />
      </Box>
    );
  }
  return (
    <Box sx={{ paddingTop: 8 }}>
      {/* Navbar 加入到編輯頁面中 */}
      <Navbar />

      <Container sx={{ paddingTop: 4, paddingBottom: 6 }}>
        <Typography variant="h4" component="div" gutterBottom>
          編輯需求文章
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ marginBottom: 3 }}>
          {/* 需求類型（僅顯示，不可編輯） */}
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              需求類型: {demandType}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              需求類型不可變更，如需不同類型的需求，請新建需求文章
            </Typography>
          </Box>

          {/* 基本資訊 */}
          <TextField
            required
            fullWidth
            label="標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            required
            fullWidth
            label="需求描述"
            value={demandDescription}
            onChange={(e) => setDemandDescription(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={4}
          />

          {/* 物資需求特殊欄位 */}
          {demandType === "物資" && (
            <>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel id="item-type-label">物資類型</InputLabel>
                <Select
                  labelId="item-type-label"
                  value={itemType}
                  label="物資類型"
                  onChange={(e) => setItemType(e.target.value)}
                >
                  <MenuItem value="">選擇物資類型</MenuItem>
                  <MenuItem value="飲料">飲料</MenuItem>
                  <MenuItem value="食物">食物</MenuItem>
                  <MenuItem value="生活用品">生活用品</MenuItem>
                  <MenuItem value="戶外用品">戶外用品</MenuItem>
                  <MenuItem value="其他">其他</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="自定義物資項目 (以逗號分隔)"
                value={customItems.join(", ")}
                onChange={(e) =>
                  setCustomItems(
                    e.target.value.split(",").map((item) => item.trim())
                  )
                }
                sx={{ marginBottom: 2 }}
              />
            </>
          )}

          {/* 金錢需求特殊欄位 */}
          {demandType === "金錢" && (
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="金額下限 (元)"
                value={moneyLowerLimit}
                onChange={(e) => setMoneyLowerLimit(e.target.value)}
                error={!!moneyError}
                helperText={moneyError}
              />
              <TextField
                fullWidth
                type="number"
                label="金額上限 (元)"
                value={moneyUpperLimit}
                onChange={(e) => setMoneyUpperLimit(e.target.value)}
                error={!!moneyError}
              />
            </Box>
          )}

          {/* 講師需求特殊欄位 */}
          {demandType === "講師" && (
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel id="speaker-type-label">講師主題</InputLabel>
              <Select
                labelId="speaker-type-label"
                value={speakerType}
                label="講師主題"
                onChange={(e) => setSpeakerType(e.target.value)}
              >
                <MenuItem value="">選擇講師主題</MenuItem>
                <MenuItem value="專業技能">專業技能</MenuItem>
                <MenuItem value="職涯分享">職涯分享</MenuItem>
                <MenuItem value="產業趨勢">產業趨勢</MenuItem>
                <MenuItem value="其他">其他</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* 共同欄位 */}
          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel id="event-nature-label">活動性質</InputLabel>
            <Select
              labelId="event-nature-label"
              value={eventNature}
              label="活動性質"
              onChange={(e) => setEventNature(e.target.value)}
            >
              <MenuItem value="">選擇活動性質</MenuItem>
              <MenuItem value="迎新">迎新</MenuItem>
              <MenuItem value="講座">講座</MenuItem>
              <MenuItem value="比賽">比賽</MenuItem>
              <MenuItem value="營隊">營隊</MenuItem>
              <MenuItem value="其他">其他</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="回饋方案"
            value={cooperationReturn}
            onChange={(e) => setCooperationReturn(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="回饋詳情"
            value={feedbackDetails}
            onChange={(e) => setFeedbackDetails(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="預估參與人數"
            type="number"
            value={estimatedParticipants}
            onChange={(e) => setEstimatedParticipants(e.target.value)}
            sx={{ marginBottom: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              required
              label="活動日期"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              error={!!dateError}
              helperText={dateError ? dateError : ""}
            />

            <TextField
              fullWidth
              label="贊助截止日期"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              value={sponsorDeadline}
              onChange={(e) => setSponsorDeadline(e.target.value)}
              inputProps={{
                max: eventDate || undefined,
              }}
              error={!!dateError}
            />
          </Box>

          <TextField
            fullWidth
            label="活動說明"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            sx={{ marginBottom: 3 }}
            multiline
            rows={4}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !!dateError || !!moneyError}
            >
              {loading ? "儲存中..." : "保存變更"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/ArticalUser")}
            >
              取消
            </Button>
          </Box>
        </Box>
      </Container>

      {/* 成功提示 */}
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ 需求文章更新成功！
        </Alert>
      </Snackbar>
    </Box>
  );
}
