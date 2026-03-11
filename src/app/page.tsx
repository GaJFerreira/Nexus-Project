"use client";

import { useAuth } from "@/core/contexts/AuthContext";
import { Layers, CheckCircle, PieChart, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Domine suas finanças com o <span className="text-purple-600">Nexus</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                A maneira mais inteligente e simples de gerenciar seu dinheiro. Acompanhe gastos, planeje seu futuro e alcance a liberdade financeira.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                >
                  Começar agora
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all flex items-center justify-center"
                >
                  Fazer login
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="bg-purple-100 rounded-3xl p-8 transform rotate-3 shadow-2xl">
                 <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-3 border border-purple-50">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-600 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="w-32 h-3 bg-gray-200 rounded"></div>
                            <div className="w-20 h-2 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-40 bg-purple-50 rounded-xl flex items-end justify-around p-4 gap-2">
                            <div className="w-full bg-purple-200 h-1/3 rounded-t"></div>
                            <div className="w-full bg-purple-400 h-2/3 rounded-t"></div>
                            <div className="w-full bg-purple-600 h-full rounded-t"></div>
                            <div className="w-full bg-purple-300 h-1/2 rounded-t"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="w-24 h-4 bg-gray-100 rounded"></div>
                            <div className="w-16 h-4 bg-purple-100 rounded"></div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo o que você precisa</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desenvolvemos ferramentas poderosas para você ter controle total sobre cada centavo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Controle de Gastos</h3>
              <p className="text-gray-600">Registre suas despesas e receitas em segundos e saiba exatamente para onde seu dinheiro está indo.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Relatórios Visuais</h3>
              <p className="text-gray-600">Visualize sua saúde financeira através de gráficos intuitivos e relatórios detalhados mensais.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Segurança Total</h3>
              <p className="text-gray-600">Seus dados estão protegidos com criptografia de ponta e autenticação segura via Firebase.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Nexus</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Nexus Financial. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-gray-400">
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Termos</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
