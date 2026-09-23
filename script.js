/* =========================================================
   INVOICE BUILDER
   Live Editing + Calculations + QR + Supabase Auth
========================================================= */

const SUPABASE_URL = "https://jilmmclikggptpnsibvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_HETZ_jyUbECuyDqOBDdPyg_WYQZr5OE";

let supabaseClient = null;

try {
    if (window.supabase?.createClient) {
        supabaseClient = window.supabase.createClient(
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
        window.__invoiceAuthClient = supabaseClient;
    }
} catch (error) {
    console.error("Supabase initialization failed:", error);
}

const DEFAULT_INVOICE = "INV-TL-2026-001";
const THINKLIMITLESS_URL = "https://www.thinklimitless.co/";

let deliverables = [];
let brandLogoData = "";

const AUTH_ROLE_KEY = "invoice_dashboard_role";

let currentRole = localStorage.getItem(AUTH_ROLE_KEY) || null;

function $(id) {
    return document.getElementById(id);
}

function showLoginScreen() {
    const authScreen = $("authScreen");
    const landingScreen = $("landingScreen");
    const app = $("app");

    if (authScreen) authScreen.classList.remove("hidden");
    if (landingScreen) landingScreen.classList.add("hidden");
    if (app) app.classList.add("hidden");
}

function showLandingScreen() {
    const authScreen = $("authScreen");
    const landingScreen = $("landingScreen");
    const app = $("app");

    if (authScreen) authScreen.classList.add("hidden");
    if (landingScreen) landingScreen.classList.remove("hidden");
    if (app) app.classList.add("hidden");
}

function showDashboard() {
    const authScreen = $("authScreen");
    const landingScreen = $("landingScreen");
    const app = $("app");

    if (authScreen) authScreen.classList.add("hidden");
    if (landingScreen) landingScreen.classList.add("hidden");
    if (app) app.classList.remove("hidden");
}

function updateRoleAccess() {
    const role = localStorage.getItem(AUTH_ROLE_KEY);

    if (!role) {
        showLoginScreen();
        return;
    }

    const isAdmin = role === "admin";

    const paymentStatus = $("paymentStatus");
    const hasDiscount = $("hasDiscount");
    const discount = $("discount");
    const discountType = $("discountType");
    const tax = $("tax");
    const fee = $("fee");
    const addDeliverable = $("addDeliverable");

    if (paymentStatus) paymentStatus.disabled = !isAdmin;
    if (hasDiscount) hasDiscount.disabled = !isAdmin;
    if (discount) discount.disabled = !isAdmin;
    if (discountType) discountType.disabled = !isAdmin;
    if (tax) tax.disabled = !isAdmin;
    if (fee) fee.readOnly = !isAdmin;
    if (addDeliverable) addDeliverable.disabled = false;

    document.querySelectorAll(".deliverable-editor input[type='number']").forEach(function (input) {
        const parent = input.closest(".two-columns");
        if (!parent) return;

        const numbers = parent.querySelectorAll("input[type='number']");
        const isAmountField = numbers.length > 1 && input === numbers[1];

        if (isAmountField) {
            input.disabled = !isAdmin;
        } else {
            input.disabled = false;
        }
    });

    document.querySelectorAll(".deliverable-editor select").forEach(function (select) {
        select.disabled = !isAdmin;
    });

    document.querySelectorAll(".remove-deliverable").forEach(function (button) {
        button.disabled = !isAdmin;
    });
}

function setupAuth() {
    const storedRole = localStorage.getItem(AUTH_ROLE_KEY);
    if (storedRole) {
        currentRole = storedRole;
        showLandingScreen();
        updateRoleAccess();
        return;
    }

    currentRole = null;
    showLoginScreen();
}

function applySavedInvoice(invoice) {
    if (!invoice) return;

    const assign = function (id, value) {
        const field = $(id);
        if (!field) return;
        if (field.type === "checkbox") {
            field.checked = Boolean(value);
            return;
        }
        field.value = value ?? "";
    };

    assign("invoiceNo", invoice.invoice_number || "");
    assign("invoiceDate", invoice.invoice_date || "");
    assign("dueDate", invoice.due_date || "");
    assign("brandName", invoice.company_name || "");
    assign("client", invoice.client_name || "");
    assign("address", invoice.client_address || "");
    assign("terms", invoice.payment_terms || "");
    assign("paymentStatus", invoice.payment_status || "DUE");
    assign("tax", invoice.tax ?? 0);
    assign("project", invoice.project || "");
    assign("footerLeft", invoice.footer_text || "");
    assign("brandTagline", invoice.brand_tagline || "");
    assign("currency", invoice.currency || "PKR");
    assign("discount", invoice.discount ?? 0);
    assign("discountType", invoice.discount_type || "percent");

    const storedDeliverables = Array.isArray(invoice.items) ? invoice.items : [];
    deliverables = storedDeliverables.map(function (item) {
        return {
            name: item.name || "",
            description: item.description || "",
            qty: Number(item.qty) || 0,
            amount: Number(item.amount) || 0,
            status: item.status || "PENDING"
        };
    });

    renderDeliverableEditors();
    updateInvoice();
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    }).format(Math.round(Number(value) || 0));
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character];
    });
}

function getCurrency() {
    return $("currency")?.value || "PKR";
}

function renderDeliverableEditors() {
    const container = $("deliverableEditors");
    if (!container) return;

    container.innerHTML = deliverables.map(function (item, index) {
        return `
            <div class="deliverable-editor">
                <div class="deliverable-head">
                    <span class="deliverable-number">DELIVERABLE ${String(index + 1).padStart(2, "0")}</span>
                    <button type="button" class="remove-deliverable" onclick="removeDeliverable(${index})">×</button>
                </div>

                <div class="form-field">
                    <label>Name</label>
                    <input type="text" value="${escapeHTML(item.name)}" oninput="updateDeliverable(${index}, 'name', this.value)">
                </div>

                <div class="form-field">
                    <label>Description</label>
                    <input type="text" value="${escapeHTML(item.description)}" oninput="updateDeliverable(${index}, 'description', this.value)">
                </div>

                <div class="two-columns">
                    <div class="form-field">
                        <label>Qty</label>
                        <input type="number" min="0" value="${item.qty}" oninput="updateDeliverable(${index}, 'qty', this.value)">
                    </div>

                    <div class="form-field">
                        <label>Amount</label>
                        <input type="number" min="0" value="${item.amount}" oninput="updateDeliverable(${index}, 'amount', this.value)">
                    </div>
                </div>

                <div class="form-field">
                    <label>Payment Status</label>
                    <select onchange="updateDeliverable(${index}, 'status', this.value)">
                        <option value="PENDING" ${item.status === "PENDING" ? "selected" : ""}>Pending</option>
                        <option value="PAID" ${item.status === "PAID" ? "selected" : ""}>Paid</option>
                        <option value="PARTIAL" ${item.status === "PARTIAL" ? "selected" : ""}>Partial</option>
                        <option value="OVERDUE" ${item.status === "OVERDUE" ? "selected" : ""}>Overdue</option>
                    </select>
                </div>
            </div>
        `;
    }).join("");

    renderDeliverableTable();
}

function updateDeliverable(index, property, value) {
    if (!deliverables[index]) return;

    if (property === "qty" || property === "amount") {
        deliverables[index][property] = Number(value) || 0;
    } else {
        deliverables[index][property] = value;
    }

    renderDeliverableTable();
    updateInvoice();
}

function addDeliverable() {
    deliverables.push({
        name: "",
        description: "",
        qty: 1,
        amount: 0,
        status: "PENDING"
    });

    renderDeliverableEditors();
    updateInvoice();
}

function removeDeliverable(index) {
    if (!deliverables[index]) return;

    deliverables.splice(index, 1);
    renderDeliverableEditors();
    updateInvoice();
}

function renderDeliverableTable() {
    const table = $("deliverableRows");
    if (!table) return;

    const currency = getCurrency();

    table.innerHTML = deliverables.map(function (item, index) {
        return `
            <tr>
                <td>
                    <span class="deliverable-name">${String(index + 1).padStart(2, "0")} &nbsp; ${escapeHTML(item.name || "DELIVERABLE")}</span>
                </td>
                <td>${escapeHTML(item.description || "")}</td>
                <td>${item.qty || 0}</td>
                <td>${currency} ${formatMoney(item.amount)}</td>
                <td><span class="deliverable-status ${(item.status || "PENDING").toLowerCase()}">${(item.status || "PENDING").toUpperCase()}</span></td>
            </tr>
        `;
    }).join("");
}

function calculateTotals() {
    const subtotal = deliverables.reduce(function (total, item) {
        return total + ((Number(item.qty) || 0) * (Number(item.amount) || 0));
    }, 0);

    let discount = 0;

    const hasDiscount = $("hasDiscount")?.checked || false;

    if (hasDiscount) {
        const discountValue = Number($("discount")?.value) || 0;
        const discountType = $("discountType")?.value || "percent";

        if (discountType === "percent") {
            discount = subtotal * (discountValue / 100);
        } else {
            discount = discountValue;
        }

        discount = Math.min(discount, subtotal);
    }

    const tax = Number($("tax")?.value) || 0;
    const afterDiscount = Math.max(subtotal - discount, 0);
    const taxAmount = afterDiscount * (tax / 100);
    const total = afterDiscount + taxAmount;

    return { subtotal, discount, tax, taxAmount, total };
}

function updateCommercial() {
    const totals = calculateTotals();
    const currency = getCurrency();

    if ($("fee")) $("fee").value = Math.round(totals.subtotal);
    if ($("outFee")) $("outFee").textContent = currency + " " + formatMoney(totals.subtotal);

    if ($("discountRow")) $("discountRow").hidden = !($("hasDiscount")?.checked);

    if ($("discountLabel")) {
        const type = $("discountType")?.value || "percent";
        const value = Number($("discount")?.value) || 0;
        $("discountLabel").textContent = type === "percent" ? value + "% discount" : "Discount";
    }

    if ($("outDiscount")) $("outDiscount").textContent = "− " + currency + " " + formatMoney(totals.discount);

    if ($("taxLabel")) $("taxLabel").textContent = (totals.tax || 0) + "% tax";
    if ($("outTax")) $("outTax").textContent = "+ " + currency + " " + formatMoney(totals.taxAmount);

    if ($("outTotal")) $("outTotal").textContent = currency + " " + formatMoney(totals.total);
}

function updateDiscountUI() {
    const enabled = $("hasDiscount")?.checked || false;

    if ($("discountBlock")) $("discountBlock").hidden = !enabled;

    const type = $("discountType")?.value || "percent";

    if ($("discountInputLabel")) {
        $("discountInputLabel").textContent = type === "percent" ? "Discount %" : "Discount Amount";
    }

    if ($("discount")) {
        if (type === "percent") {
            $("discount").max = "100";
        } else {
            $("discount").removeAttribute("max");
        }
    }

    updateCommercial();
}

function updateDiscountAndInvoice() {
    updateDiscountUI();
    updateInvoice();
}

function updateClient() {
    const client = $("client")?.value.trim();
    const address = $("address")?.value.trim();

    if ($("outClient")) $("outClient").textContent = client || "Client Name";
    if ($("outAddress")) $("outAddress").textContent = address || "Client address";

    updateProject();
}

function updateProject() {
    const project = $("project")?.value.trim() || "Project Name";
    const client = $("client")?.value.trim() || "CLIENT";

    if ($("outProject")) $("outProject").textContent = project;
    if ($("footerRight")) $("footerRight").textContent = (client + " · " + project).toUpperCase();
}

function updatePaymentStatus() {
    const status = $("paymentStatus")?.value || "DUE";
    const output = $("outStatus");
    if (!output) return;

    output.textContent = status;
    output.classList.remove("paid", "pending", "due");
    output.classList.add(status.toLowerCase());
}

function updateInvoiceDate() {
    if (!$("outDate")) return;
    $("outDate").textContent = formatDate($("invoiceDate")?.value);
}

function updateInvoiceNumber() {
    const invoiceNumber = $("invoiceNo")?.value.trim() || DEFAULT_INVOICE;
    if ($("qrNumber")) $("qrNumber").textContent = invoiceNumber;
}

function updateQR() {
    updateInvoiceNumber();
}

function updatePaymentTerms() {
    if (!$("outTerms")) return;
    $("outTerms").textContent = $("terms")?.value || "100% due on invoice";
}

function updateBranding() {
    const brandName = $("brandName")?.value.trim() || "THINKLIMITLESS";
    const brandTagline = $("brandTagline")?.value.trim() || "AI · MEDIA · CREATIVITY";

    if ($("outBrandName")) $("outBrandName").textContent = brandName;
    if ($("outBrandTagline")) $("outBrandTagline").textContent = brandTagline;

    const logo = $("outBrandLogo");
    if (!logo) return;

    if (brandLogoData) {
        logo.src = brandLogoData;
        logo.classList.add("has-image");
    } else {
        logo.removeAttribute("src");
        logo.classList.remove("has-image");
    }
}

function handleBrandLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        brandLogoData = reader.result;
        updateBranding();
    };
    reader.readAsDataURL(file);
}

function updateFooter() {
    const footerText = $("footerLeft")?.value.trim();
    if ($("outFooterLeft")) $("outFooterLeft").textContent = footerText || "THINKLIMITLESS © 2026";
}

function generateQR() {
    const qrContainer = $("qr");
    if (!qrContainer) {
        console.error("QR container not found.");
        return;
    }

    qrContainer.innerHTML = "";
    if (typeof QRCode === "undefined") {
        console.error("QRCode library not loaded.");
        return;
    }

    new QRCode(qrContainer, {
        text: "https://www.thinklimitless.co/",
        width: 96,
        height: 96,
        correctLevel: QRCode.CorrectLevel.H
    });
}

function updateInvoice() {
    updateDiscountUI();
    updateClient();
    updateProject();
    updatePaymentStatus();
    updateInvoiceDate();
    updateInvoiceNumber();
    updatePaymentTerms();
    updateBranding();
    updateFooter();
    updateCommercial();
    renderDeliverableTable();
}

function collectInvoiceData() {
    const totals = calculateTotals();

    return {
        invoice_number: $("invoiceNo")?.value.trim() || DEFAULT_INVOICE,
        invoice_date: $("invoiceDate")?.value || null,
        due_date: $("dueDate")?.value || null,
        company_name: $("brandName")?.value.trim() || "",
        client_name: $("client")?.value.trim() || "",
        client_address: $("address")?.value.trim() || "",
        client_email: "",
        payment_status: $("paymentStatus")?.value || "DUE",
        payment_terms: $("terms")?.value.trim() || "",
        company_email: "",
        website: THINKLIMITLESS_URL,
        division: "",
        discount: totals.discount,
        tax: totals.tax,
        subtotal: totals.subtotal,
        total: totals.total,
        items: deliverables
    };
}

async function saveInvoice() {
    const client = window.__invoiceAuthClient || supabaseClient;

    if (!client) {
        alert("Unable to save invoice: database is not configured.");
        return;
    }

    try {
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) {
            alert("Your login session is missing or expired. Please log in again.");
            return;
        }

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !profile || !["admin", "employee"].includes(profile.role)) {
            console.error("PROFILE ERROR:", profileError);
            alert("Your user profile could not be found. Please contact the administrator.");
            return;
        }

        const invoice = collectInvoiceData();
        const invoiceWithUser = { ...invoice, user_id: user.id };

        const { error } = await client.from("invoices").insert([invoiceWithUser]);
        if (error) {
            console.error("SAVE INVOICE ERROR:", error);
            alert("Could not save invoice.\n\n" + error.message);
            return;
        }

        alert("Invoice saved successfully!");
    } catch (error) {
        console.error("SAVE INVOICE FAILED:", error);
        alert("Unable to save invoice. Please try logging in again.");
    }
}

function resetInvoice() {
    const fields = [
        "invoiceNo",
        "invoiceDate",
        "dueDate",
        "client",
        "address",
        "project",
        "terms",
        "footerLeft",
        "brandName",
        "brandTagline"
    ];

    fields.forEach(function (id) {
        const field = $(id);
        if (field) field.value = "";
    });

    if ($("currency")) $("currency").value = "PKR";
    if ($("paymentStatus")) $("paymentStatus").value = "DUE";
    if ($("hasDiscount")) $("hasDiscount").checked = false;
    if ($("discount")) $("discount").value = "0";
    if ($("discountType")) $("discountType").value = "percent";
    if ($("tax")) $("tax").value = "0";
    if ($("brandLogo")) $("brandLogo").value = "";

    deliverables = [];
    brandLogoData = "";

    renderDeliverableEditors();
    updateDiscountUI();
    updateInvoice();
    updateQR();
}

function printInvoice() {
    window.print();
}

function setupEventListeners() {
    const liveFields = [
        "currency",
        "invoiceNo",
        "invoiceDate",
        "dueDate",
        "client",
        "address",
        "project",
        "paymentStatus",
        "tax",
        "terms",
        "footerLeft",
        "brandName",
        "brandTagline"
    ];

    liveFields.forEach(function (id) {
        const field = $(id);
        if (!field) return;
        field.addEventListener("input", updateInvoice);
        field.addEventListener("change", updateInvoice);
    });

    if ($("invoiceNo")) $("invoiceNo").addEventListener("input", updateQR);

    if ($("hasDiscount")) $("hasDiscount").addEventListener("change", updateDiscountAndInvoice);
    if ($("discountType")) $("discountType").addEventListener("change", updateDiscountAndInvoice);
    if ($("discount")) $("discount").addEventListener("input", updateDiscountAndInvoice);

    if ($("addDeliverable")) $("addDeliverable").addEventListener("click", addDeliverable);
    if ($("brandLogo")) $("brandLogo").addEventListener("change", handleBrandLogo);
    if ($("clearBtn")) $("clearBtn").addEventListener("click", resetInvoice);
    if ($("saveBtn")) $("saveBtn").addEventListener("click", saveInvoice);
    if ($("printBtn")) $("printBtn").addEventListener("click", printInvoice);
}

window.addDeliverable = addDeliverable;
window.removeDeliverable = removeDeliverable;
window.updateDeliverable = updateDeliverable;
window.saveInvoice = saveInvoice;
// =========================================================
// LANDING PAGE INVOICE ACTIONS
// =========================================================

function startNewInvoice() {
    console.log("NEW INVOICE clicked");

    resetInvoice();

    // Generate a fresh invoice number
    const invoiceNumberField = $("invoiceNo");

    if (invoiceNumberField) {
        const year = new Date().getFullYear();
        invoiceNumberField.value = `INV-TL-${year}-001`;
    }

    updateInvoice();
    updateQR();

    showDashboard();
}


async function openExistingInvoice() {
    console.log("OPEN INVOICE clicked");

    const client = window.__invoiceAuthClient || supabaseClient;

    if (!client) {
        alert("Database connection is not available.");
        return;
    }

    // Find the invoice number input on the landing screen.
    // This works even if your input does not have a specific ID.
    const landingScreen = $("landingScreen");

    if (!landingScreen) {
        alert("Landing screen not found.");
        return;
    }

    const input = landingScreen.querySelector("input");

    if (!input) {
        alert("Please enter an invoice number.");
        return;
    }

    const invoiceNumber = input.value.trim();

    if (!invoiceNumber) {
        alert("Please enter an invoice number.");
        input.focus();
        return;
    }

    try {
        const {
            data: { user },
            error: authError
        } = await client.auth.getUser();

        if (authError || !user) {
            alert("Your login session has expired. Please log in again.");
            showLoginScreen();
            return;
        }

        const { data: invoice, error } = await client
            .from("invoices")
            .select("*")
            .eq("invoice_number", invoiceNumber)
            .maybeSingle();

        if (error) {
            console.error("OPEN INVOICE ERROR:", error);
            alert("Could not open invoice.\n\n" + error.message);
            return;
        }

        if (!invoice) {
            alert(`Invoice "${invoiceNumber}" was not found.`);
            return;
        }

        console.log("OPENED INVOICE:", invoice);

        applySavedInvoice(invoice);

        showDashboard();
        updateRoleAccess();
        updateInvoice();
        updateQR();

    } catch (error) {
        console.error("OPEN INVOICE FAILED:", error);
        alert("Unable to open invoice. Please try again.");
    }
}


// Expose functions globally
window.startNewInvoice = startNewInvoice;
window.openExistingInvoice = openExistingInvoice;
document.addEventListener("DOMContentLoaded", async function () {
    setupAuth();
    setupEventListeners();
    renderDeliverableEditors();
    updateDiscountUI();
    updateInvoice();
    updateRoleAccess();
    generateQR();

    if (window.__invoiceAuthClient) {
        const client = window.__invoiceAuthClient;
        const { data: { session }, error } = await client.auth.getSession();
        if (!error && session?.user) {
            const { data: profile } = await client.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
            if (profile && ["admin", "employee"].includes(profile.role)) {
                localStorage.setItem(AUTH_ROLE_KEY, profile.role);
                showLandingScreen();
                updateRoleAccess();
            }
        }
    }

    console.log("Invoice Builder initialized successfully.");
});



































































