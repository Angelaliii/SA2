import axios from "axios";
import FormData from "form-data";
import formidable from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // 停用內建的 body parser，因為我們要處理表單資料和文件
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "只允許 POST 請求" });
  }

  try {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true; // 保留文件的擴展名
    form.multiples = true; // 支持多個文件

    const [fields, files]: [any, any] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // 建立要發送到 Flask 後端的表單數據
    const formData = new FormData();

    // 添加文字欄位
    Object.keys(fields).forEach((key) => {
      if (Array.isArray(fields[key])) {
        // 處理可能的多值欄位，如 cooperationFields
        fields[key].forEach((value: string) => {
          formData.append(key, value);
        });
      } else {
        formData.append(key, fields[key]);
      }
    });

    // 處理文件上傳
    if (files.logo) {
      const logoFile = files.logo;
      formData.append("logo", fs.createReadStream(logoFile.filepath), {
        filename: logoFile.originalFilename,
        contentType: logoFile.mimetype,
      });
    }

    if (files.clubCertificate) {
      const certFile = files.clubCertificate;
      formData.append(
        "clubCertificate",
        fs.createReadStream(certFile.filepath),
        {
          filename: certFile.originalFilename,
          contentType: certFile.mimetype,
        }
      );
    }

    // 發送請求到後端 API
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5000";
    const response = await axios.post(
      `${backendUrl}/api/register/club`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    // 清理暫時文件
    if (files.logo) {
      fs.unlinkSync(files.logo.filepath);
    }
    if (files.clubCertificate) {
      fs.unlinkSync(files.clubCertificate.filepath);
    }

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("處理社團註冊請求時出錯:", error);
    return res.status(500).json({
      success: false,
      message: "處理註冊請求失敗",
      error: error.message || "伺服器內部錯誤",
    });
  }
}
