import { useState } from "react";

export default function LoginPopup({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email:email, password:password }),
      }); 

      const data = await res.json();

      if (!res.ok) {
        setError("Login failed");
        console.log(data.message || "Login failed");
      } else {
        onLogin?.();
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>Login</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
        <div className="login-footer">
          <span>Don't have an account? </span>
          <a
            className="register-link"
            onClick={() => onSwitchToRegister?.()}
          >
            Register
          </a>
        </div>
      </div>

      <style jsx>{`
        .login-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          place-items: center;

          /* blur + dim background */
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .login-box {
          width: 90%;
          max-width: 380px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        h2 {
          margin: 0;
          text-align: center;
        }

        .login-error {
          background: #ffe2e2;
          color: #b00000;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        input {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 0.95rem;
        }

        button {
          padding: 10px;
          border-radius: 8px;
          border: none;
          background: #4b7bec;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }

        button:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .login-footer {
          text-align: center;
          margin-top: 4px;
          font-size: 0.9rem;
        }

        .register-link {
          color: #1a73e8;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}