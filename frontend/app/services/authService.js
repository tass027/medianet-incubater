// Service d'authentification mocké pour le développement
// Basé sur les vrais utilisateurs de votre page Users

const mockUsers = {
  // ✅ ADMIN - Correspond à votre page Users
  'Mohamed.jerbi@medianet.tn': { 
    id: 1, 
    name: 'Mohamed Jerbi', 
    email: 'Mohamed.jerbi@medianet.tn', 
    role: 'admin',
    department: 'Head of project Management',
    company: 'MEDIANET',
    location: 'Tunis',
    avatar: null 
  },
  
  // ✅ FOUNDERS (Intrapreneurs)
  'ahmed.trabelsi@medianet.tn': { 
    id: 2, 
    name: 'Ahmed Trabelsi', 
    email: 'ahmed.trabelsi@medianet.tn', 
    role: 'founder',
    department: 'R&D',
    project: 'AI Customer Service',
    company: 'MEDIANET (Intrapreneur)',
    location: 'Tunis',
    avatar: null 
  },
  
  'sara.benali@medianet.tn': { 
    id: 7, 
    name: 'Sara Ben Ali', 
    email: 'sara.benali@medianet.tn', 
    role: 'founder',
    department: 'Digital Marketing',
    project: 'EduTech Platform',
    company: 'MEDIANET (Intrapreneur)',
    location: 'Tunis',
    avatar: null 
  },
  
  // ✅ INVESTORS (Africinvest)
  'samia.belhadj@africinvest.com': { 
    id: 3, 
    name: 'Samia Belhadj', 
    email: 'samia.belhadj@africinvest.com', 
    role: 'investor',
    fund: 'Africinvest North Africa Fund',
    company: 'Africinvest Group',
    location: 'Tunis',
    avatar: null 
  },
  
  'mehdi.gharbi@africinvest.com': { 
    id: 6, 
    name: 'Mehdi Gharbi', 
    email: 'mehdi.gharbi@africinvest.com', 
    role: 'investor',
    fund: 'Africinvest Tech Fund',
    company: 'Africinvest Group',
    location: 'Casablanca',
    avatar: null 
  },
  
  // ✅ MENTOR
  'Karim.Ghorbel@mentor.tn': { 
    id: 4, 
    name: 'Karim Ghorbel', 
    email: 'Karim.Ghorbel@mentor.tn', 
    role: 'mentor',
    expertise: 'Chief Financial Officer',
    company: 'Medianet',
    location: 'Tunis',
    avatar: null 
  },
  
  // ✅ APPLICANT
  'imen.benammar@startup.tn': { 
    id: 5, 
    name: 'Imen Ben Ammar', 
    email: 'imen.benammar@startup.tn', 
    role: 'applicant',
    startup: 'PayTunis',
    stage: 'Seed',
    company: 'External Applicant',
    location: 'Tunis',
    avatar: null 
  },
};

// Route par rôle (identique à celle de votre page de login)
const ROLE_ROUTES = {
  applicant: '/dashboard/applicant/dashboard',
  investor:  '/dashboard/investor/dashboard',
  mentor:    '/dashboard/mentor/dashboard',
  founder:   '/dashboard/founder/dashboard',
  admin:     '/dashboard/admin/dashboard',
};

export const authAPI = {
  // ✅ Login - utilise les vrais emails de votre application
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Nettoyer l'email (ignorer la casse)
        const cleanEmail = email.toLowerCase();
        const user = mockUsers[cleanEmail] || mockUsers[email];
        
        // ✅ Mot de passe accepté: 'password' ou 'admin123' pour les tests
        const validPasswords = ['password', 'admin123', 'test123'];
        
        if (user && validPasswords.includes(password)) {
          resolve({
            data: {
              user,
              accessToken: 'mock-jwt-token-' + Date.now(),
              refreshToken: 'mock-refresh-token-' + Date.now(),
            }
          });
        } else {
          reject({
            response: {
              data: {
                message: 'Invalid email or password'
              }
            }
          });
        }
      }, 800);
    });
  },

  // ✅ Register - crée un nouvel utilisateur
  register: async (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: Date.now(),
          name: userData.name,
          email: userData.email,
          role: userData.role || 'applicant',
          company: userData.role === 'applicant' ? 'External Applicant' : 
                   userData.role === 'investor' ? 'Africinvest Group' :
                   userData.role === 'mentor' ? 'Mentor' : 'MEDIANET',
          location: userData.location || 'Tunis',
          avatar: null
        };
        
        resolve({
          data: {
            user: newUser,
            accessToken: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          }
        });
      }, 1500);
    });
  },

  // ✅ Logout
  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true,
            message: 'Logged out successfully' 
          } 
        });
      }, 300);
    });
  },

  // ✅ Vérification du token
  verifyToken: async (token) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            valid: true,
            user: { id: 1, email: 'Mohamed.jerbi@medianet.tn', role: 'admin' }
          }
        });
      }, 300);
    });
  }
};

// Export aussi les routes si nécessaire
export { ROLE_ROUTES };