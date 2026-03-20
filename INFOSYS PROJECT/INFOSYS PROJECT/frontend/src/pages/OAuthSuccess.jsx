import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const token = params.get("token");

    if (!token) {
      toast.error("Google login failed");
      navigate("/", { replace: true });
      return;
    }

    localStorage.setItem("token", token);

    window.history.replaceState({}, document.title, "/oauth-success");

    toast.success("Google login successful 🎉");
    navigate("/dashboard", { replace: true });
  }, [params, navigate]);

  return null;
}

export default OAuthSuccess;
