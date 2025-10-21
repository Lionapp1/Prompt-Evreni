// KULLANICI İÇİN NOT: Lütfen aşağıdaki Firebase yapılandırma bilgilerinizi girin.
// Bu bilgileri Firebase projenizin ayarlar bölümünde "Proje Ayarları > Genel" altında bulabilirsiniz.
// Bu kodun çalışması için HTML <head> içinde Firebase SDK script'lerini eklemiş olmanız gerekir:
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey: "AIzaSyCxU8TbgXda7KXgYsNLKkeAbhug3E2mc78",
  authDomain: "prompt-131c4.firebaseapp.com",
  projectId: "prompt-131c4",
  storageBucket: "prompt-131c4.firebasestorage.app",
  messagingSenderId: "128172389927",
  appId: "1:128172389927:web:87cbc9f0b0f243dd504002",
  measurementId: "G-3RSCHK789E"
};

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Initialization
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- DOM ELEMENTLERİ ---
    const allNavLinks = document.querySelectorAll('.nav-link[data-page], .form-switch a[data-page]');
    const pages = document.querySelectorAll('.page');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutLink = document.getElementById('logout-link');
    const addPromptNavItem = document.getElementById('add-prompt-nav-item');
    const userInfoDiv = document.getElementById('user-info');
    const userEmailSpan = document.getElementById('user-email');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const addPromptForm = document.getElementById('add-prompt-form');
    const promptGrid = document.getElementById('prompt-grid');
    const promptCardTemplate = document.getElementById('prompt-card-template');
    const toast = document.getElementById('toast-notification');
    const loader = document.getElementById('loader');
    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');

    let currentPrompts = []; // Gelen prompt'ları saklamak için

    // --- ARAYÜZ FONKSİYONLARI ---

    const showLoader = (show) => {
        loader.style.display = show ? 'flex' : 'none';
    };

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(pageId);
        if (activePage) activePage.classList.add('active');

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
            userInfoDiv.style.display = 'flex';
            userEmailSpan.textContent = user.email;
        } else {
            loginLink.style.display = 'inline-block';
            registerLink.style.display = 'inline-block';
            logoutLink.style.display = 'none';
            addPromptNavItem.style.display = 'none';
            userInfoDiv.style.display = 'none';
            userEmailSpan.textContent = '';
        }
    };

    const renderPrompts = (promptsToRender) => {
        promptGrid.innerHTML = '';
        if (promptsToRender.length === 0) {
            promptGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1;">Sonuç bulunamadı veya hiç prompt paylaşılmadı.</p>';
            return;
        }

        promptsToRender.forEach(promptData => {
            const card = promptCardTemplate.content.cloneNode(true).children[0];
            card.querySelector('.card-title').textContent = promptData.title;
            card.querySelector('.card-body').textContent = promptData.text;
            card.querySelector('.ai-model-tag').textContent = promptData.model;
            card.querySelector('.author-email').textContent = promptData.authorEmail;
            card.dataset.promptText = promptData.text;
            card.dataset.model = promptData.model.toLowerCase();
            card.dataset.title = promptData.title.toLowerCase();
            card.dataset.text = promptData.text.toLowerCase();
            promptGrid.appendChild(card);
        });
    };

    // --- FİLTRELEME VE ARAMA ---
    const filterAndRenderPrompts = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = categoryFilters.querySelector('.active').dataset.model;

        const filtered = currentPrompts.filter(prompt => {
            const matchesCategory = activeFilter === 'all' || prompt.model === activeFilter;
            const matchesSearch = prompt.title.toLowerCase().includes(searchTerm) || prompt.text.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        renderPrompts(filtered);
    };

    // --- FIREBASE İŞLEMLERİ ---

    const fetchPrompts = () => {
        showLoader(true);
        const promptsCollection = db.collection('prompts').orderBy('createdAt', 'desc');
        promptsCollection.onSnapshot(snapshot => {
            currentPrompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterAndRenderPrompts();
            showLoader(false);
        }, error => {
            console.error("Error fetching prompts: ", error);
            showToast('Promptlar yüklenirken bir hata oluştu.', true);
            showLoader(false);
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

    auth.onAuthStateChanged(user => {
        updateUIForAuthState(user);
        // Kullanıcı giriş yaptığında ana sayfaya yönlendir ve formu sıfırla
        if (user) {
            if(document.getElementById('login-page').classList.contains('active') || document.getElementById('register-page').classList.contains('active')){
                 showPage('prompts-page');
            }
        }
    });

    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            showToast('Başarıyla çıkış yapıldı.');
            showPage('prompts-page');
        } catch (error) {
            showToast(`Çıkış yapılamadı: ${error.message}`, true);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            showToast('Başarıyla kayıt olundu! Hoş geldiniz.');
            registerForm.reset();
        } catch (error) {
            showToast(`Kayıt hatası: ${error.message}`, true);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            showToast('Başarıyla giriş yapıldı.');
            loginForm.reset();
        } catch (error) {
            showToast(`Giriş hatası: ${error.message}`, true);
        }
    });

    addPromptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showToast('Prompt eklemek için giriş yapmalısınız.', true);
            showPage('login-page');
            return;
        }

        const newPrompt = {
            title: document.getElementById('prompt-title').value,
            text: document.getElementById('prompt-text').value,
            model: document.getElementById('ai-model').value,
            authorId: user.uid,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('prompts').add(newPrompt);
            showToast('Prompt başarıyla paylaşıldı!');
            addPromptForm.reset();
            showPage('prompts-page');
        } catch (error) {
            showToast(`Bir hata oluştu: ${error.message}`, true);
        }
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

    searchInput.addEventListener('input', filterAndRenderPrompts);

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            categoryFilters.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            filterAndRenderPrompts();
        }
    });

    // --- BAŞLANGIÇ ---
    const initializeApp = () => {
        showPage('prompts-page');
        fetchPrompts();
    };

    initializeApp();
});
