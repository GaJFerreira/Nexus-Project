"use client";

import Link from "next/link";
import { LogIn, LogOut, User, Home, List, Layers, Wallet, Receipt, UserPlus} from "lucide-react";

const Header = () => {

    const login = true;

    return(
        <header className="bg-white shadow-sm border-b border-purple-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/*Canto esquerdo*/}
                    <div className="flex items-center gap-8">
                        {/*Logo*/}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-purple-600 text-white p-1.5 rounded-lg group-hover:bg-purple-900 transition-colors">
                                {/* Ícone simples simulando logo */}
                                <Layers className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-xl text-gray-900 tracking-tight">Nexus</span>
                        </Link>

                        {login ?(
                            <nav className="flex gap-2 text-black">
                                <div className="flex gap-1">
                                    <Link href={"/"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition hover:bg-gray-100">
                                    <Home className="w-5 h-5" />
                                    Home
                                </Link>

                                <Link href={"/dashboard"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition hover:bg-gray-100">
                                    <List className="w-5 h-5" />
                                    Dashboard
                                </Link>

                                <Link href={"/accounts"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition hover:bg-gray-100">
                                    <Wallet className="w-5 h-5" />
                                    Contas
                                </Link>

                                <Link href={"/transactions"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition hover:bg-gray-100">
                                    <Receipt className="w-5 h-5"/>
                                    Transações
                                </Link>
                                </div>
                            </nav>
                        ):(
                            <nav>

                            </nav>
                        )}
                    </div>

                    {/*Canto direto*/}
                    <div className="flex items-center gap-4">
                        {!login ? (
                        <nav className="hidden md:flex gap-2">
                        <Link
                            href="/login" className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 transition">
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>

                        <Link
                            href="/register" className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-purple-600 text-purple-600 hover:bg-purple-50 transition">
                            <UserPlus className="w-4 h-4"/>
                            Cadastro
                        </Link>
                        </nav>

                        ) : (
                            <nav className="flex gap-4 text-black">
                                
                                <div className="flex">
                                    <Link href={"/profile"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition hover:bg-gray-100">
                                        <User className="w-5 h-5" />
                                        Perfil
                                    </Link>

                                    <Link href={"/logout"} className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:text-red-500 transition hover:bg-gray-100">
                                        <LogOut className="w-5 h-5" />
                                        Sair
                                    </Link>
                                </div>

                            </nav>
                            
                        )}
                    </div>
                </div>
            </div>

        </header>

    )
}

export default Header;