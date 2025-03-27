"use client";
import ImageIcon from "@mui/icons-material/Image";
import {
  Autocomplete,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";

const postLocations = ["企業版", "社團版"];
const tagOptions = ["教學", "科技", "活動"];

export default function PublishPage() {
  const [location, setLocation] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            發布文章
          </Typography>
          <Typography variant="body2" align="center" gutterBottom></Typography>

          <Stack spacing={2} mt={2}>
            <Select
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled hidden>
                請選擇發文位置
              </MenuItem>
              {postLocations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <TextField
              fullWidth
              label="文章內容"
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="請輸入文章內容"
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageIcon />}
            >
              <Typography component="span">上傳圖片</Typography>
              <input type="file" hidden onChange={handleImageUpload} />
            </Button>
            {imageFile && (
              <Typography variant="body2">已選擇：{imageFile.name}</Typography>
            )}

            <Autocomplete
              multiple
              options={tagOptions}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderInput={(params) => <TextField {...params} label="標籤" />}
            />

            <Button variant="contained" color="primary" fullWidth>
              發文
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
