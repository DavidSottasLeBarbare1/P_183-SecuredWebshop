// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;

    // Verify if the user is logged in
    let isLoggedIn = false;
    try {
        const res = await fetch('/api/profile', { credentials: 'include', redirect: 'manual' });
        isLoggedIn = res.type !== 'opaqueredirect' && res.ok;
    } catch (e) {}

    nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                    <a href="/">Accueil</a>
                    ${isLoggedIn ? '<a href="/profile">Profil</a>' : ''}
                    ${isLoggedIn
                        ? '<a href="#" id="logout-btn">Déconnexion</a>'
                        : '<a href="/login">Connexion</a><a href="/register">Inscription</a>'
                    }
                </nav>
            </div>
        </header>
    `;

    if (isLoggedIn) {
        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/login';
        });
    }
});