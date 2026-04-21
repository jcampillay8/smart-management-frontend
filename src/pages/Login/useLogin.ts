// src/pages/Login/useLogin.ts
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setError("Credenciales incorrectas o cuenta no confirmada");
      setSubmitting(false);
    } else {
      navigate("/", { replace: true });
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    error, submitting,
    handleSubmit
  };
}