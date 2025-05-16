import React from "react";
import { Club } from "../../firebase/services/club-service";
import EditableClubProfile from "./EditableClubProfile";
import ReadOnlyClubProfile from "./ReadOnlyClubProfile";

interface ClubProfileFormProps {
  clubData: Club;
  onSubmit: (updatedData: Partial<Club>) => Promise<void>;
  readonly?: boolean;
}

const ClubProfileForm: React.FC<ClubProfileFormProps> = ({
  clubData,
  onSubmit,
  readonly = false,
}) => {
  // 根據 readonly 屬性決定顯示唯讀或可編輯模式
  if (readonly) {
    return <ReadOnlyClubProfile clubData={clubData} />;
  }

  return <EditableClubProfile clubData={clubData} onSubmit={onSubmit} />;
};

export default ClubProfileForm;
