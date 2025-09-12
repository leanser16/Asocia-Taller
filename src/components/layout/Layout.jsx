import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Users, Briefcase, DollarSign, ShoppingCart, BarChart2, LogOut, Moon, Sun, Menu, X as CloseIcon, Wrench as Tool, CreditCard, TrendingUp, UserSquare, Car, Truck, Wallet, Package, Settings, User as UserIcon } from 'lucide-react';
import NavItem from './NavItem';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Clientes', icon: UserSquare, path: '/customers' },
    { name: 'Vehículos', icon: Car, path: '/vehicles' },
    { name: 'Órdenes de Trabajo', icon: Tool, path: '/work-orders' },
    { name: 'Ventas', icon: DollarSign, path: '/sales' },
    { name: 'Cobros', icon: CreditCard, path: '/collections' },
    { name: 'Proveedores', icon: Truck, path: '/suppliers' },
    { name: 'Compras', icon: ShoppingCart, path: '/purchases' },
    { name: 'Pagos', icon: TrendingUp, path: '/payments' },
    { name: 'Cheques en Cartera', icon: Wallet, path: '/checks' },
    { name: 'Productos', icon: Package, path: '/products' },
    { name: 'Empleados', icon: Users, path: '/employees' },
    { name: 'Resultados', icon: BarChart2, path: '/results' },
];

const Layout = ({ children }) => {
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { toast } = useToast();
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleLogout = async () => {
        const { error } = await signOut();
        if (!error) {
            toast({
                title: "¡Hasta luego!",
                description: "Has cerrado sesión.",
                variant: "default"
            });
        }
    };
    
    const handleGoToSettings = () => {
      navigate('/settings');
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.aside 
                        initial={{ x: '-100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '-100%' }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                        className="hidden md:flex md:flex-col w-64 bg-card border-r border-border p-4 space-y-4 fixed h-full z-20"
                    >
                        <SidebarContent />
                    </motion.aside>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={toggleMobileMenu} />}
            </AnimatePresence>
            
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside 
                        initial={{ x: '-100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '-100%' }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                        className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border p-4 space-y-4 z-40 flex flex-col md:hidden"
                    >
                        <SidebarContent onLinkClick={toggleMobileMenu} showCloseButton={true} onClose={toggleMobileMenu} />
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen && 'md:ml-64'}`}>
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-card border-b border-border">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:inline-flex mr-4">
                            <Menu className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="md:hidden mr-4">
                            <Menu className="h-6 w-6" />
                        </Button>
                        <h2 className="text-xl font-semibold">Bienvenido</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                            {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative cursor-pointer">
                                    <img className="h-10 w-10 rounded-full border-2 border-primary" alt="Avatar de usuario" src={`https://avatar.vercel.sh/${user.email}.png?s=40`} />
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleGoToSettings}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configuración</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleGoToSettings}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {children}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

const SidebarContent = ({ onLinkClick, showCloseButton, onClose }) => (
    <>
        <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center space-x-2 text-primary" onClick={onLinkClick}>
                <Briefcase className="h-8 w-8" />
                <h1 className="text-2xl font-bold">AsociaTaller</h1>
            </Link>
            {showCloseButton && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <CloseIcon className="h-6 w-6" />
                </Button>
            )}
        </div>
        <nav className="flex-grow space-y-2 overflow-y-auto">
            {navItems.map(item => <NavItem key={item.name} item={item} onClick={onLinkClick} />)}
        </nav>
    </>
);

export default Layout;