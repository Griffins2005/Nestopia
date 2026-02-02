import React, { useContext } from "react";
import AuthContext from "../context/authContext";
import PreferencesForm from "../components/preferences/form";
import { useNavigate } from "react-router-dom";

export default function CompleteProfile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return <div>Please log in first.</div>;

  return (
    <div>
      <h2>Set Your Preferences</h2>
      <PreferencesForm
        userType={user.role}
        onComplete={() => navigate("/profile")}
      />
    </div>
  );
}
