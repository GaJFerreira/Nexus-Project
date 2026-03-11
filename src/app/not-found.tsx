import Link from 'next/link';
import { Layers } from 'lucide-react';

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg">
            <Layers className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Página não encontrada</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Desculpe, a página que você está procurando não existe ou foi movida para outro endereço.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md shadow-purple-200"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
