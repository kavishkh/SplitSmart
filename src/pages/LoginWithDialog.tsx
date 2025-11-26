import { useState, useEffect } from "react";
import Login from "./Login";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

const LoginWithDialog = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const handleOpenForgotPassword = () => {
      setShowForgotPassword(true);
    };

    window.addEventListener('openForgotPassword', handleOpenForgotPassword);
    
    return () => {
      window.removeEventListener('openForgotPassword', handleOpenForgotPassword);
    };
  }, []);

  return (
    <>
      <Login />
      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </>
  );
};

export default LoginWithDialog;