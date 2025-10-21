// KULLANICI İÇİN NOT: Lütfen aşağıdaki Firebase yapılandırma bilgilerinizi girin.
// Bu bilgileri Firebase projenizin ayarlar bölümünde "Proje Ayarları > Genel" altında bulabilirsiniz.
// Bu kodun çalışması için HTML <head> içinde Firebase SDK script'lerini eklemiş olmanız gerekir:
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

document.addEventListener('DOMContentLoaded', () => {
    const allNavLinks = document.querySelectorAll('.nav-link[data-page], .form-switch a[data-page]');
    const pages = document.querySelectorAll('.page');
    
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutLink = document.getElementById('logout-link');
    const addPromptNavItem = document.getElementById('add-prompt-nav-item');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const addPromptForm = document.getElementById('add-prompt-form');

    const promptGrid = document.getElementById('prompt-grid');
    const promptCardTemplate = document.getElementById('prompt-card-template');
    const toast = document.getElementById('toast-notification');

    // --- YEREL VERİ VE OTURUM YÖNETİMİ (Firebase Simülasyonu) ---
    let currentUser = null;
    let prompts = [];

    const samplePrompts = [
        {
            title: "Sosyal Medya İçerik Fikri",
            text: "Bir teknoloji şirketi için bir sonraki ürün lansmanını duyuran 3 yaratıcı Instagram gönderi fikri oluştur.",
            model: "GPT-4",
            authorEmail: "ornek@kullanici.com",
            createdAt: new Date()
        },
        {
            title: "Fantastik Manzara Çizimi",
            text: "Uçan adaların ve parlayan şelalelerin olduğu, fantastik bir dünya manzarası, dijital sanat.",
            model: "Midjourney",
            authorEmail: "ornek@kullanici.com",
            createdAt: new Date()
        }
    ];

    const getPromptsFromStorage = () => {
        const storedPrompts = localStorage.getItem('prompts');
        if (storedPrompts) {
            return JSON.parse(storedPrompts);
        } else {
            localStorage.setItem('prompts', JSON.stringify(samplePrompts));
            return samplePrompts;
        }
    };

    const savePromptsToStorage = () => {
        localStorage.setItem('prompts', JSON.stringify(prompts));
    };

    const getCurrentUser = () => {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    };

    const setCurrentUser = (user) => {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
        currentUser = user;
        updateUIForAuthState(currentUser);
    };

    // --- ARAYÜZ FONKSİYONLARI ---

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(pageId);
        if(activePage) activePage.classList.add('active');

        document.querySelectorAll('.nav-links .nav-link').forEach(link => link.classList.remove('active'));
        const mainNavLink = document.querySelector(`.nav-links .nav-link[data-page='${pageId}']`);
        if (mainNavLink) mainNavLink.classList.add('active');
    };

    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.className = 'toast show';
        if (isError) toast.classList.add('error');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    const updateUIForAuthState = (user) => {
        if (user) {
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutLink.style.display = 'inline-block';
            addPromptNavItem.style.display = 'list-item';
        } else {
            loginLink.style.display = 'inline-block';
            registerLink.style.display = 'inline-block';
            logoutLink.style.display = 'none';
            addPromptNavItem.style.display = 'none';
        }
    };

    const renderPrompts = () => {
        promptGrid.innerHTML = '';
        if (prompts.length === 0) {
            promptGrid.innerHTML = '<p style="color: var(--text-secondary);">Henüz hiç prompt paylaşılmamış. İlk paylaşan sen ol!</p>';
            return;
        }
        
        const sortedPrompts = [...prompts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        sortedPrompts.forEach(promptData => {
            const card = promptCardTemplate.content.cloneNode(true).children[0];
            card.querySelector('.card-title').textContent = promptData.title;
            card.querySelector('.card-body').textContent = promptData.text;
            card.querySelector('.ai-model-tag').textContent = promptData.model;
            card.dataset.promptText = promptData.text;
            promptGrid.appendChild(card);
        });
    };

    // --- OLAY DİNLEYİCİLERİ ---

    allNavLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const pageId = e.currentTarget.getAttribute('data-page');
            showPage(pageId);
        });
    });

    logoutLink.addEventListener('click', e => {
        e.preventDefault();
        setCurrentUser(null);
        showToast('Başarıyla çıkış yapıldı.');
        showPage('prompts-page');
    });

    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const newUser = { email };
        setCurrentUser(newUser);
        showToast('Başarıyla kayıt olundu! Hoş geldiniz.');
        showPage('prompts-page');
        registerForm.reset();
    });

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const user = { email };
        setCurrentUser(user);
        showToast('Başarıyla giriş yapıldı.');
        showPage('prompts-page');
        loginForm.reset();
    });

    addPromptForm.addEventListener('submit', e => {
        e.preventDefault();
        if (!currentUser) {
            showToast('Prompt eklemek için giriş yapmalısınız.', true);
            showPage('login-page');
            return;
        }

        const newPrompt = {
            title: document.getElementById('prompt-title').value,
            text: document.getElementById('prompt-text').value,
            model: document.getElementById('ai-model').value,
            authorEmail: currentUser.email,
            createdAt: new Date().toISOString()
        };

        prompts.push(newPrompt);
        savePromptsToStorage();
        renderPrompts();
        showToast('Prompt başarıyla paylaşıldı!');
        addPromptForm.reset();
        showPage('prompts-page');
    });

    promptGrid.addEventListener('click', e => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            const card = copyBtn.closest('.prompt-card');
            const textToCopy = card.dataset.promptText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const btnSpan = copyBtn.querySelector('span');
                btnSpan.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    btnSpan.textContent = 'Kopyala';
                }, 2000);
            }).catch(err => {
                showToast('Kopyalama başarısız oldu.', true);
            });
        }
    });

    // --- BAŞLANGIÇ ---
    const initializeApp = () => {
        currentUser = getCurrentUser();
        prompts = getPromptsFromStorage();
        updateUIForAuthState(currentUser);
        renderPrompts();
        showPage('prompts-page'); 
    };

    initializeApp();
});