import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import "./Login.scss";

function Login() {
  const [, /** password, */ setPassword] = useState("");
  // const navigate = useNavigate();

  return (
    <div className="login">
      <div className="login-form">
        <div className="login-form-title">
          <h1>Login</h1>
        </div>
        <div className="login-form-input">
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="login-form-button">
          <button>Login</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
