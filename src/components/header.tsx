"use client";

import Link from "next/link";
import {
  LogIn,
  LogOut,
  Home,
  Layers,
  LayoutDashboard,
  Wallet,
  Receipt,
  UserPlus,
  Moon,
  Sun,
  ChevronDown,
  Upload,
} from "lucide-react";
import { useAuth } from "@/core/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/transactions", label: "Transações", icon: Receipt },
  { href: "/import", label: "Importar", icon: Upload },
];


function UserAvatar({ name, email }: { name?: string | null; email?: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : email?.[0]?.toUpperCase() ?? "U";

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--accent)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-overlay)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 1.25rem",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Esquerda: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Layers size={16} color="white" />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Nexus
            </span>
          </Link>

          {/* Nav Links (apenas logado) */}
          {user && (
            <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.4rem 0.75rem",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: active ? 600 : 500,
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      backgroundColor: active ? "var(--accent-subtle)" : "transparent",
                      textDecoration: "none",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Direita: Toggle + User */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Toggle Tema */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "all 150ms ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Usuário logado */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((p) => !p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.3rem 0.6rem 0.3rem 0.3rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <UserAvatar name={user.displayName} email={user.email} />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: "var(--text-tertiary)",
                    transform: menuOpen ? "rotate(180deg)" : "none",
                    transition: "transform 150ms ease",
                    flexShrink: 0,
                  }}
                />
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Dropdown */}
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      minWidth: 180,
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 50,
                      overflow: "hidden",
                      padding: "0.375rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.5rem 0.75rem 0.75rem",
                        borderBottom: "1px solid var(--border-subtle)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {user.displayName || "Usuário"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-tertiary)",
                          margin: 0,
                          marginTop: 1,
                        }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogOut();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.45rem 0.75rem",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        color: "var(--danger)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--danger-bg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <LogOut size={14} />
                      Sair da conta
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Não logado */
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.45rem 0.875rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 150ms ease",
                }}
              >
                <LogIn size={14} />
                Entrar
              </Link>
              <Link
                href="/register"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.45rem 0.875rem",
                  borderRadius: 8,
                  background: "var(--accent)",
                  color: "white",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 150ms ease",
                }}
              >
                <UserPlus size={14} />
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;