'use client';

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');    
    const router = useRouter(); 
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) =>{
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        try{
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: name,
                    email,
                    password
                }),
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.message);
            }
            
            await signInWithEmailAndPassword(auth, email, password);

            router.push('/dashboard');

        } catch (erro: any){
            console.log(erro);
            if(erro.code === 'auth/email-already-in-use'){
                setError('Email já cadastrado');
            }else{
                setError('Erro ao cadastrar usuário');
            }

        } finally{
            setLoading(false);
        }
    
    }

    return(
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-lg border border-purple-200 bg-white shadow-md">

                {/* Cabeçalho */}
                <div className="px-6 py-6 text-center border-b border-gray-200">
                    <h1 className="text-black text-2xl text-bold">Bem vindo!</h1>
                    <p className="mt-1 text-sm text-gray-600">Preencha seus dados para fazer o cadastro</p>
                </div>

                <div className="px-6 py-6">

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">  
                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome
                            </label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"/>
                        </div>

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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Confirme sua senha
                            </label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700" />
                        </div>

                        {/* Erro */}
                        {error && (
                            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {/* Botão */}
                        <button type="submit" className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                        
                    </form>

                    {/* Link cadastro */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Ja possui uma conta?{' '}
                        <Link href="/login" className="font-medium text-purple-600 hover:underline">
                            Entrar
                        </Link>
                    </div>

                </div>

            </div>
        </div>

    )
}