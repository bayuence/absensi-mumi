    "use client";

    import Link from "next/link";
    import { useRouter } from "next/navigation";
    import { useEffect, useState } from "react";

    export default function Navbar() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState("");

    useEffect(() => {
        const user = localStorage.getItem("loggedUser");
        if (!user) {
        router.push("/login");
        } else {
        setUsername(user);
        }
        
        // Get current path for active link highlighting
        setCurrentPath(window.location.pathname);
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: "🏠" },
        { href: "/absensi", label: "Presensi", icon: "✅" },
        { href: "/laporan", label: "Laporan", icon: "📊" },
        ...(username === "admin" ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : [])
    ];

    return (
        <>
        {/* Navbar */}
        <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                {/* Logo/Brand */}
                <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">🕌</span>
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MUMI BP Kulon
                    </h1>
                </div>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 group ${
                        currentPath === link.href
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                    >
                    <div className="flex items-center space-x-2">
                        <span className="text-base">{link.icon}</span>
                        <span>{link.label}</span>
                    </div>
                    
                    {/* Active indicator */}
                    {currentPath === link.href && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </Link>
                ))}
                </div>

                {/* User Profile & Actions */}
                <div className="flex items-center space-x-4">
                {/* User Profile */}
                <div className="hidden sm:flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                        {username.charAt(0).toUpperCase()}
                    </span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <span className="text-gray-600 text-sm">👋</span>
                    <span className="text-gray-800 font-medium text-sm">{username}</span>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                    <span>🚪</span>
                    <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-300"
                >
                    <div className="w-5 h-5 flex flex-col justify-center items-center">
                    <span className={`block w-4 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></span>
                    <span className={`block w-4 h-0.5 bg-gray-700 my-0.5 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block w-4 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`}></span>
                    </div>
                </button>
                </div>
            </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white border-t border-gray-100 shadow-lg">
                <div className="px-4 py-4 space-y-2">
                {/* Mobile User Profile */}
                <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                        {username.charAt(0).toUpperCase()}
                    </span>
                    </div>
                    <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-600">👋</span>
                        <span className="text-gray-800 font-medium">{username}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Selamat datang kembali!</p>
                    </div>
                </div>

                {/* Mobile Navigation Links */}
                {navLinks.map((link, index) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        currentPath === link.href
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                    style={{
                        animationDelay: `${index * 100}ms`
                    }}
                    >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                    {currentPath === link.href && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                    </Link>
                ))}
                </div>
            </div>
            </div>
        </nav>

        {/* Backdrop for mobile menu */}
        {isMenuOpen && (
            <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
            ></div>
        )}
        </>
    );
    }