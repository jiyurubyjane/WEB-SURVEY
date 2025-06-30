import { useAuth } from "../context/AuthContext";
import SurveyDesigner from "./dashboard/SurveyDesigner";
import SurveyTaker from "./dashboard/SurveyTaker";

function InputSurveyPage() {
  const { user } = useAuth();

  if (user?.peran === 'Admin') {
    return <SurveyDesigner />;
  }
  
  if (user?.peran === 'Surveyor') {
    return <SurveyTaker />;
  }

  return <p className="p-8">Anda tidak memiliki akses ke halaman ini.</p>;
}

export default InputSurveyPage;
