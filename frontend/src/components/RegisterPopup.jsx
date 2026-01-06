import { useState } from "react";

export default function RegisterPopup({ onSwitchToLogin }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async(e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email:email, password:password }),
      }); 

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        console.log(data.message);
      } else {
        onSwitchToLogin?.();
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>Register</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="First name"
            disabled={loading}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />

          <input
            type="text"
            placeholder="Last name"
            disabled={loading}
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <span>Already have an account? </span>
          <a className="register-link" onClick={() => onSwitchToLogin?.()}>
            Login
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
