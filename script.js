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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const promptsCollection = db.collection('prompts');

document.addEventListener('DOMContentLoaded', () => {
    const allNavLinks = document.querySelectorAll('.nav-link[data-page], .form-switch a[data-page]');
    const pages = document.querySelectorAll('.page');
    const mainNavLinks = document.querySelectorAll('.nav-links .nav-link');

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

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(pageId);
        if(activePage) activePage.classList.add('active');

        allNavLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`.nav-link[data-page='${pageId}']`)?.classList.add('active');
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

    auth.onAuthStateChanged(user => {
        updateUIForAuthState(user);
        fetchAndRenderPrompts(); 
        if (!user) {
            showPage('prompts-page');
        }
    });

    allNavLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const pageId = e.currentTarget.getAttribute('data-page');
            showPage(pageId);
        });
    });

    logoutLink.addEventListener('click', e => {
        e.preventDefault();
        auth.signOut().then(() => {
            showToast('Başarıyla çıkış yapıldı.');
            showPage('prompts-page');
        }).catch(error => showToast(`Çıkış hatası: ${error.message}`, true));
    });

    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                showToast('Başarıyla kayıt olundu! Hoş geldiniz.');
                showPage('prompts-page');
                registerForm.reset();
            })
            .catch(error => showToast(`Kayıt hatası: ${error.message}`, true));
    });

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                showToast('Başarıyla giriş yapıldı.');
                showPage('prompts-page');
                loginForm.reset();
            })
            .catch(error => showToast(`Giriş hatası: ${error.message}`, true));
    });

    addPromptForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showToast('Prompt eklemek için giriş yapmalısınız.', true);
            return;
        }

        const title = document.getElementById('prompt-title').value;
        const text = document.getElementById('prompt-text').value;
        const model = document.getElementById('ai-model').value;

        promptsCollection.add({
            title,
            text,
            model,
            authorId: user.uid,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showToast('Prompt başarıyla paylaşıldı!');
            addPromptForm.reset();
            showPage('prompts-page');
        }).catch(error => showToast(`Hata: ${error.message}`, true));
    });

    const fetchAndRenderPrompts = () => {
        promptsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            promptGrid.innerHTML = '';
            if (snapshot.empty) {
                promptGrid.innerHTML = '<p style="color: var(--text-secondary);">Henüz hiç prompt paylaşılmamış. İlk paylaşan sen ol!</p>';
                return;
            }
            snapshot.forEach(doc => {
                const promptData = doc.data();
                const card = promptCardTemplate.content.cloneNode(true).children[0];
                card.querySelector('.card-title').textContent = promptData.title;
                card.querySelector('.card-body').textContent = promptData.text;
                card.querySelector('.ai-model-tag').textContent = promptData.model;
                card.dataset.promptText = promptData.text;
                promptGrid.appendChild(card);
            });
        }, error => {
            console.error("Promptları çekerken hata: ", error);
            promptGrid.innerHTML = '<p style="color: var(--text-secondary);">Promptlar yüklenirken bir hata oluştu.</p>';
        });
    };

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
});
