import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Palette, Shield, Info } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import ProfileSettings from '@/components/settings/ProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import AboutSection from '@/components/settings/AboutSection';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/customSupabaseClient';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const SettingsPage = () => {
  const { toast } = useToast();
  const { user, organization, refreshData } = useAuth();
  
  const [profileData, setProfileData] = React.useState({
    name: '',
    email: '',
    sale_document_number_mode: 'automatic',
    logo_url: '',
    owner_name: '',
    address: '',
    phone: '',
    tax_id: '',
  });
  
  const [appearance, setAppearance] = React.useState({
    darkMode: typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false,
    language: 'es',
  });

  useEffect(() => {
    if (user && organization) {
        setProfileData({
            name: organization.name || '',
            email: user.email || '',
            sale_document_number_mode: organization.sale_document_number_mode || 'automatic',
            logo_url: organization.logo_url || '',
            owner_name: organization.owner_name || '',
            address: organization.address || '',
            phone: organization.phone || '',
            tax_id: organization.tax_id || '',
        });
    }
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setAppearance(prev => ({ ...prev, darkMode: true}));
    } else {
         document.documentElement.classList.remove('dark');
         setAppearance(prev => ({ ...prev, darkMode: false}));
    }
  }, [user, organization]);

  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleAppearanceChange = (name, value) => {
    if (name === 'darkMode') {
      setAppearance({ ...appearance, darkMode: value });
      if (value) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } else {
      setAppearance({ ...appearance, [name]: value });
    }
  };

  const handleProfileSubmit = async () => {
    if (!organization) return;
    try {
        const { error } = await supabase
            .from('organizations')
            .update({ 
                name: profileData.name,
                sale_document_number_mode: profileData.sale_document_number_mode,
                owner_name: profileData.owner_name,
                address: profileData.address,
                phone: profileData.phone,
                tax_id: profileData.tax_id,
            })
            .eq('id', organization.id);

        if (error) throw error;
        
        toast({
            title: "Perfil Actualizado",
            description: "La información de tu taller ha sido guardada.",
        });
        await refreshData();
    } catch(error) {
        toast({
            title: "Error al actualizar",
            description: `No se pudo guardar la información. ${error.message}`,
            variant: "destructive"
        });
    }
  };

  const handleLogoUpload = async (file) => {
    if (!user || !organization) {
      toast({ title: "Error", description: "Usuario u organización no encontrados.", variant: "destructive" });
      return;
    }

    const BUCKET_NAME = 'logos';

    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      // Check if bucket exists
      const { data: bucketList, error: listError } = await supabase.storage.listBuckets();
      if(listError) throw new Error(`Error al verificar buckets: ${listError.message}`);

      const bucketExists = bucketList.some(bucket => bucket.id === BUCKET_NAME);

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(
          BUCKET_NAME,
          {
            public: true, 
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
            fileSizeLimit: 1024 * 1024 * 5, // 5MB
          }
        );

        if (createBucketError) {
          throw new Error(`No se pudo crear el bucket de almacenamiento: ${createBucketError.message}`);
        }
      }

      // Upload file
      const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });
      
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
          throw new Error("No se pudo obtener la URL pública del logo.");
      }

      const logoUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', organization.id);

      if (dbError) throw dbError;

      setProfileData(prev => ({ ...prev, logo_url: logoUrl }));
      await refreshData();
      toast({ title: "Logo Actualizado", description: "El logo de tu taller se ha subido correctamente." });

    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({ title: "Error al subir logo", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = (section) => {
    toast({
      title: "Configuración Guardada",
      description: `Los ajustes de ${section} han sido guardados.`,
      variant: "default",
    });
  };

  const settingsTabs = [
    { value: "profile", label: "Perfil", icon: User, component: <ProfileSettings data={profileData} onChange={handleProfileChange} onLogoUpload={handleLogoUpload} onSubmit={handleProfileSubmit} /> },
    { value: "appearance", label: "Apariencia", icon: Palette, component: <AppearanceSettings settings={appearance} onChange={handleAppearanceChange} onSubmit={() => handleSubmit('Apariencia')} /> },
    { value: "security", label: "Seguridad", icon: Shield, component: <SecuritySettings onSubmit={() => handleSubmit('Seguridad')} /> },
    { value: "about", label: "Acerca de", icon: Info, component: <AboutSection /> },
  ];

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold tracking-tight text-primary">Configuración General</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-muted/50 p-1 rounded-lg">
          {settingsTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <tab.icon className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline-block">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {settingsTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};

export default SettingsPage;