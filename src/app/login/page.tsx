'use client';

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Layers, Eye, EyeOff, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (erro: any) {
      console.log(erro);
      if (erro.code === 'auth/wrong-password' || erro.code === 'auth/user-not-found' || erro.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos. Verifique seus dados.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 58px)",
        display: "flex",
        backgroundColor: "var(--bg-base)",
      }}
    >
      {/* Painel esquerdo — Branding */}
      <div
        style={{
          display: "none",
          flex: 1,
          background: "linear-gradient(145deg, var(--accent) 0%, #3730A3 100%)",
          padding: "3rem",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
        className="lg:flex"
      >
        {/* Círculos decorativos */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", position: "relative" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={20} color="white" />
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
            Nexus
          </span>
        </div>

        {/* Copy */}
        <div style={{ position: "relative" }}>
          <h2
            style={{
              color: "white",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 1rem",
            }}
          >
            Domine suas finanças com inteligência
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9375rem", lineHeight: 1.7, margin: 0 }}>
            Acompanhe gastos, planeje metas e tenha total clareza sobre sua vida financeira.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2rem", marginTop: "2.5rem" }}>
            {[
              { label: "Transações", value: "100%" },
              { label: "Segurança", value: "Firebase" },
              { label: "Gratuito", value: "✓" },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ color: "white", fontWeight: 700, fontSize: "1.25rem", margin: 0, letterSpacing: "-0.02em" }}>
                  {s.value}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", margin: 0, marginTop: 2 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — Formulário */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Header do formulário */}
          <div style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 0.375rem",
                letterSpacing: "-0.03em",
              }}
            >
              Bem-vindo de volta
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Entre com sua conta para continuar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "0.375rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="input-field"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* Senha */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Senha
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Sua senha"
                  className="input-field"
                  style={{ fontSize: "0.9rem", paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  borderRadius: 10,
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger-muted)",
                }}
              >
                <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--danger)" }}>{error}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.75rem",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Entrando...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <LogIn size={16} />
                  Entrar
                </span>
              )}
            </button>
          </form>

          {/* Link cadastro */}
          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Não tem uma conta?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .lg\\:flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}