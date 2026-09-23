/* Supabase email/password authentication for Invoice Maker. */
(function () {
    const SUPABASE_URL = "https://jilmmclikggptpnsibvy.supabase.co";
    const SUPABASE_KEY = "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE";
    const ROLE_KEY = "invoice_dashboard_role";

    function byId(id) {
        return document.getElementById(id);
    }

    function setLoginError(message) {
        const error = byId("loginError");
        if (error) error.textContent = message || "";
    }

    function clearLocalAuth() {
        localStorage.removeItem(ROLE_KEY);
        if (byId("loginPassword")) byId("loginPassword").value = "";
        if (typeof showLoginScreen === "function") showLoginScreen();
    }

    async function loadProfile(client, user) {
        if (!user) {
            clearLocalAuth();
            return null;
        }

        const { data: profile, error } = await client
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (error || !profile || !["admin", "employee"].includes(profile.role)) {
            console.error("PROFILE ERROR:", error || "Invalid profile");
            await client.auth.signOut();
            setLoginError("Your account profile is missing or invalid. Contact the administrator.");
            clearLocalAuth();
            return null;
        }

        localStorage.setItem(ROLE_KEY, profile.role);
        window.__invoiceAuthRole = profile.role;

        if (typeof updateRoleAccess === "function") updateRoleAccess();
        if (typeof showLandingScreen === "function") showLandingScreen();

        return profile;
    }

    async function handleLogin(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const emailField = byId("loginEmail");
        const passwordField = byId("loginPassword");
        const loginButton = byId("loginBtn");

        const email = emailField?.value.trim();
        const password = passwordField?.value || "";

        setLoginError("");
        if (!email || !password) {
            setLoginError("Enter your email and password.");
            return;
        }

        if (loginButton) loginButton.disabled = true;

        const client = window.__invoiceAuthClient || window.supabase?.createClient(
            "https://jilmmclikggptpnsibvy.supabase.co",
            "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE"
        );

        if (!client) {
            setLoginError("Supabase client is not available.");
            if (loginButton) loginButton.disabled = false;
            return;
        }

        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (loginButton) loginButton.disabled = false;

        if (error) {
            console.error("SUPABASE LOGIN ERROR:", error);
            setLoginError(error.message || "Unable to log in.");
            return;
        }

        await loadProfile(client, data.user);
    }

    async function handleLogout(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const client = window.__invoiceAuthClient || window.supabase?.createClient(
            "https://jilmmclikggptpnsibvy.supabase.co",
            "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE"
        );

        if (client) {
            await client.auth.signOut();
        }

        clearLocalAuth();
    }

    function ensureEmailField() {
        if (byId("loginEmail")) return;

        const passwordField = byId("loginPassword")?.closest(".auth-field");
        if (!passwordField) return;

        const emailField = passwordField.cloneNode(true);
        const label = emailField.querySelector("label");
        const input = emailField.querySelector("input");

        label.textContent = "Email";
        label.htmlFor = "loginEmail";
        input.id = "loginEmail";
        input.type = "email";
        input.name = "email";
        input.autocomplete = "username";
        input.placeholder = "Enter your email";

        byId("loginPassword").autocomplete = "current-password";
        passwordField.parentNode.insertBefore(emailField, passwordField);
    }

    document.addEventListener("DOMContentLoaded", async function () {
        ensureEmailField();

        if (!window.supabase?.createClient) {
            setLoginError("Supabase could not be loaded. Check your internet connection.");
            return;
        }

        const client = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        window.__invoiceAuthClient = client;

        byId("loginBtn")?.addEventListener("click", handleLogin, true);
        byId("loginPassword")?.addEventListener("keydown", function (event) {
            if (event.key === "Enter") handleLogin(event);
        });
        byId("logoutBtn")?.addEventListener("click", handleLogout, true);
        byId("landingLogoutBtn")?.addEventListener("click", handleLogout, true);

        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
            console.error("SUPABASE SESSION ERROR:", error);
            clearLocalAuth();
        } else if (session?.user) {
            const profile = await loadProfile(client, session.user);
            if (profile && typeof showLandingScreen === "function") {
                showLandingScreen();
            }
        } else {
            clearLocalAuth();
        }

        client.auth.onAuthStateChange(function (event) {
            if (event === "SIGNED_OUT") clearLocalAuth();
        });
    });
})();
