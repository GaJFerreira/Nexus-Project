'use client';

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');    
    const router = useRouter();
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) =>{
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (erro: any){
            console.log(erro);
            if(erro.code === 'auth/wrong-password'){
                setError('Email ou senha incorretos');
            }else{
                setError('Erro ao fazer login');
            }

        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-lg border border-purple-200 bg-white shadow-md">

                {/* Cabeçalho */}
                <div className="px-6 py-6 text-center border-b border-gray-200">
                    <h1 className="text-black text-2xl text-bold">Bem vindo!</h1>
                    <p className="mt-1 text-sm text-gray-600">Entre com sua conta para continuar</p>
                </div>

                <div className="px-6 py-6">

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">  
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"/>
                        </div>
                        
                        {/* Senha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700" />
                        </div>

                        {/* Erro */}
                        {error && (
                            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {/* Botão */}
                        <button type="submit" className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                        
                    </form>

                    {/* Link cadastro */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Não tem uma conta?{' '}
                        <Link href="/register" className="font-medium text-purple-600 hover:underline">
                            Cadastre-se
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    )
    
}