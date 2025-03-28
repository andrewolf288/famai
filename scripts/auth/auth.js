async function handleLogout() {
    try {
        await client.post('/auth/logout', null, {
            headers: {
                'Accept': 'application/json'
            }
        });
        // Borramos el localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('modulos');
        // Navegamos al login
        window.location.href = `/${config.XAMPP_CARPET}/login.html`;
    } catch (error) {
        console.log(error);
    }
}
