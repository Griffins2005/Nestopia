// src/pages/edit.js
import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../../context/authContext";
import { useParams, useNavigate } from "react-router-dom";
import { getListingById } from "../../api/listings";
import CreateListingForm from "./create";

export default function EditListingPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [fields, setFields] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    getListingById(id)
      .then(res => setFields(res.data));
  }, [id, user]);

  if (!fields) return <div>Loading...</div>;

  return (
    <CreateListingForm
      edit={true}
      initialFields={fields}
      onClose={() => navigate("/profile")}
      onSubmitDone={() => navigate("/profile")}
    />
  );
}
