import axios from "axios";
import FormData from "form-data";
import { IncomingForm } from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // 停用內建的 body parser，因為我們要處理表單資料和文件
  },
};

// Helper function to parse form with formidable
const parseForm = async (req: NextApiRequest) => {
  const form = new IncomingForm({
    keepExtensions: true,
    multiples: true,
  });

  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
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
    const { fields, files } = await parseForm(req);

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
      const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
      formData.append("logo", fs.createReadStream(logoFile.filepath), {
        filename: logoFile.originalFilename || "logo.png",
        contentType: logoFile.mimetype,
      });
    }

    if (files.businessCertificate) {
      const certFile = Array.isArray(files.businessCertificate)
        ? files.businessCertificate[0]
        : files.businessCertificate;

      formData.append(
        "businessCertificate",
        fs.createReadStream(certFile.filepath),
        {
          filename: certFile.originalFilename || "certificate.pdf",
          contentType: certFile.mimetype,
        }
      );
    }

    // 發送請求到後端 API
    // 確保後端URL有默認值，防止環境變數未設置
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5000";
    console.log("發送請求到後端URL:", backendUrl);

    try {
      const response = await axios.post(
        `${backendUrl}/api/register/company`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      // 清理暫時文件
      if (files.logo) {
        const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
        fs.unlinkSync(logoFile.filepath);
      }
      if (files.businessCertificate) {
        const certFile = Array.isArray(files.businessCertificate)
          ? files.businessCertificate[0]
          : files.businessCertificate;
        fs.unlinkSync(certFile.filepath);
      }

      return res.status(200).json(response.data);
    } catch (axiosError: any) {
      console.error("發送請求到後端時發生錯誤:", axiosError);
      // 返回更詳細的錯誤訊息
      return res.status(500).json({
        success: false,
        message: "後端API請求失敗",
        error: axiosError.message || "無法連接到後端服務",
        details: axiosError.response?.data || "無詳細錯誤信息",
      });
    }
  } catch (error: any) {
    console.error("處理企業註冊請求時出錯:", error);
    return res.status(500).json({
      success: false,
      message: "處理註冊請求失敗",
      error: error.message || "伺服器內部錯誤",
    });
  }
}
