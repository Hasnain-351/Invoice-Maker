/* Supabase email/password authentication for Invoice Maker. */
(function () {
    const SUPABASE_URL = "https://jilmmclikggptpnsibvy.supabase.co";
    const SUPABASE_KEY = "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE";
    const ROLE_KEY = "invoice_dashboard_role";

    let client;

    function byId(id) {
        return document.getElementById(id);
    }

    function setError(message) {
        const error = byId("loginError");
        if (error) error.textContent = message || "";
    }

    function showLoggedOut() {
        localStorage.removeItem(ROLE_KEY);
        if (typeof showLoginScreen === "function") showLoginScreen();
    }

    async function setAuthenticatedUser(user) {
        if (!user) {
            showLoggedOut();
            return;
        }

        const { data: profile, error } = await client
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (error || !profile) {
            console.error("PROFILE ERROR:", error);
            await client.auth.signOut();
            setError("Your account profile was not found. Please contact the administrator.");
            showLoggedOut();
            return;
        }

        if (profile.role !== "admin" && profile.role !== "employee") {
            await client.auth.signOut();
            setError("Your account does not have a valid application role.");
            showLoggedOut();
            return;
        }

        localStorage.setItem(ROLE_KEY, profile.role);
        if (typeof updateRoleAccess === "function") updateRoleAccess();
        if (typeof showLandingScreen === "function") showLandingScreen();
    }

    async function login(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const email = byId("loginEmail").value.trim();
        const password = byId("loginPassword").value;
        const button = byId("loginBtn");

        setError("");
        if (!email || !password) {
            setError("Enter your email and password.");
            return;
        }

        button.disabled = true;
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        button.disabled = false;

        if (error) {
            console.error("LOGIN ERROR:", error);
            setError(error.message || "Unable to log in.");
            return;
        }

        await setAuthenticatedUser(data.user);
    }

    async function logout(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await client.auth.signOut();
        showLoggedOut();
    }

    document.addEventListener("DOMContentLoaded", async function () {
        if (!window.supabase || !window.supabase.createClient) {
            setError("Supabase could not be loaded. Check your internet connection.");
            return;
        }

        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        const password = byId("loginPassword");
        const passwordField = password && password.closest(".auth-field");
        if (password && passwordField && !byId("loginEmail")) {
            const emailField = passwordField.cloneNode(true);
            emailField.querySelector("label").textContent = "Email";
            const email = emailField.querySelector("input");
            email.id = "loginEmail";
            email.type = "email";
            email.name = "email";
            email.placeholder = "Enter email";
            passwordField.parentNode.insertBefore(emailField, passwordField);
        }

        byId("loginBtn")?.addEventListener("click", login, true);
        byId("loginPassword")?.addEventListener("keydown", function (event) {
            if (event.key === "Enter") login(event);
        });
        byId("logoutBtn")?.addEventListener("click", logout, true);
        byId("landingLogoutBtn")?.addEventListener("click", logout, true);

        const { data: { session } } = await client.auth.getSession();
        await setAuthenticatedUser(session?.user || null);

        client.auth.onAuthStateChange(function (event, session) {
            if (event === "SIGNED_OUT") showLoggedOut();
        });
    });
})();
