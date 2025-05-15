"use client";

import React from "react";
import { Company } from "../../firebase/services/company-service";
import EditableCompanyProfile from "./EditableCompanyProfile";
import ReadOnlyCompanyProfile from "./ReadOnlyCompanyProfile";

interface CompanyProfileFormProps {
  companyData: Company;
  onSubmit: (updatedData: Partial<Company>, logoFile?: File) => Promise<void>;
  readonly?: boolean;
}

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({
  companyData,
  onSubmit,
  readonly = false,
}) => {
  // 根據 readonly 屬性決定顯示唯讀或可編輯模式
  if (readonly) {
    return <ReadOnlyCompanyProfile companyData={companyData} />;
  }

  return (
    <EditableCompanyProfile companyData={companyData} onSubmit={onSubmit} />
  );
};

export default CompanyProfileForm;
