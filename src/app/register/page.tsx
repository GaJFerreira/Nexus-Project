'use client';

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Layers, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (erro: any) {
      console.log(erro);
      if (erro.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso. Tente fazer login.');
      } else {
        setError(erro.message || 'Erro ao cadastrar. Tente novamente.');
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
          background: "linear-gradient(145deg, #3730A3 0%, var(--accent) 100%)",
          padding: "3rem",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
        className="lg:flex"
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
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
            right: -60,
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

        {/* Features list */}
        <div style={{ position: "relative" }}>
          <h2
            style={{
              color: "white",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.25,
              margin: "0 0 2rem",
            }}
          >
            Comece a controlar suas finanças hoje
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              "Registre transações em segundos",
              "Acompanhe parcelas e recorrências",
              "Planejamento financeiro completo",
              "Metas e caixinhas de poupança",
            ].map((feature) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={12} color="white" />
                </div>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>{feature}</span>
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
        <div style={{ width: "100%", maxWidth: 420 }}>
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
              Crie sua conta
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Preencha seus dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Nome */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Seu nome"
                className="input-field"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
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
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="input-field"
                  style={{ fontSize: "0.9rem", paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", alignItems: "center", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
                Confirmar senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita sua senha"
                  className="input-field"
                  style={{
                    fontSize: "0.9rem",
                    paddingRight: "2.75rem",
                    borderColor: confirmPassword.length > 0
                      ? passwordsMatch ? "var(--success)" : "var(--danger)"
                      : undefined,
                  }}
                />
                <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  {confirmPassword.length > 0 && (
                    passwordsMatch
                      ? <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
                      : null
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Cadastrando...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <UserPlus size={16} />
                  Criar conta
                </span>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Já tem uma conta?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) { .lg\\:flex { display: flex !important; } }
      `}</style>
    </div>
  );
}