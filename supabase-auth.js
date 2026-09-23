/* =========================================================
   SUPABASE AUTHENTICATION
   Email/password login, persistent sessions, profile roles, logout
========================================================= */
(function () {
    const SUPABASE_URL = "https://jilmmclikggptpnsibvy.supabase.co";
    const SUPABASE_KEY = "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE";
    const ROLE_KEY = "invoice_dashboard_role";

    let authClient = null;
    let authReady = false;

    function $(id) {
        return document.getElementById(id);
    }

    function setLoginError(message) {
        const element = $("loginError");
        if (element) element.textContent = message || "";
    }

    function clearLocalAuth() {
        localStorage.removeItem(ROLE_KEY);
        if ($("loginPassword")) $("loginPassword").value = "";
        if (typeof showLoginScreen === "function") showLoginScreen();
    }

    function ensureEmailField() {
        if ($("loginEmail")) return;

        const password = $("loginPassword");
        const passwordField = password?.closest(".auth-field");
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

        password.autocomplete = "current-password";
        passwordField.parentNode.insertBefore(emailField, passwordField);
    }

    async function loadProfile(user) {
        if (!user) {
            clearLocalAuth();
            return null;
        }

        const { data: profile, error } = await authClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (error || !profile || !["admin", "employee"].includes(profile.role)) {
            console.error("PROFILE ERROR:", error || "Invalid profile");
            await authClient.auth.signOut();
            setLoginError("Your account profile is missing or invalid. Contact the administrator.");
            clearLocalAuth();
            return null;
        }

        localStorage.setItem(ROLE_KEY, profile.role);
        if (typeof updateRoleAccess === "function") updateRoleAccess();
        return profile;
    }

    async function handleLogin(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!authReady) {
            setLoginError("Authentication is still loading. Try again.");
            return;
        }

        const email = $("loginEmail")?.value.trim();
        const password = $("loginPassword")?.value || "";
        const button = $("loginBtn");

        setLoginError("");
        if (!email || !password) {
            setLoginError("Enter your email and password.");
            return;
        }

        if (button) button.disabled = true;
        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (button) button.disabled = false;

        if (error) {
            console.error("SUPABASE LOGIN ERROR:", error);
            setLoginError(error.message || "Unable to log in.");
            return;
        }

        const profile = await loadProfile(data.user);
        if (profile && typeof showLandingScreen === "function") {
            setLoginError("");
            showLandingScreen();
        }
    }

    async function handleLogout(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (authClient) await authClient.auth.signOut();
        clearLocalAuth();
    }

    document.addEventListener("DOMContentLoaded", async function () {
        ensureEmailField();

        if (!window.supabase?.createClient) {
            setLoginError("Supabase could not be loaded. Check your internet connection.");
            return;
        }

        authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        authReady = true;

        // Capture-phase handlers prevent the old local-password handlers in script.js.
        $("loginBtn")?.addEventListener("click", handleLogin, true);
        $("loginPassword")?.addEventListener("keydown", function (event) {
            if (event.key === "Enter") handleLogin(event);
        });
        $("logoutBtn")?.addEventListener("click", handleLogout, true);
        $("landingLogoutBtn")?.addEventListener("click", handleLogout, true);

        const { data: { session }, error } = await authClient.auth.getSession();
        if (error) {
            console.error("SUPABASE SESSION ERROR:", error);
            clearLocalAuth();
        } else if (session?.user) {
            await loadProfile(session.user);
            if (localStorage.getItem(ROLE_KEY) && typeof showLandingScreen === "function") {
                showLandingScreen();
            }
        } else {
            clearLocalAuth();
        }

        authClient.auth.onAuthStateChange(function (event) {
            if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
                if (event === "SIGNED_OUT") clearLocalAuth();
            }
        });
    });
})();
