import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NavItem = ({ item, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link 
        to={item.path} 
        onClick={onClick} 
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 ${isActive ? "bg-primary/10 text-primary font-semibold" : ""}`}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Link>
    </motion.div>
  );
};

export default NavItem;