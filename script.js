/* =========================================================
   INVOICE BUILDER
========================================================= */


/* =========================================================
   DOM HELPER
========================================================= */

const $ = (id) => {

    return document.getElementById(id);

};


/* =========================================================
   DEFAULT INVOICE NUMBER
========================================================= */

const DEFAULT_INVOICE =
    "INV-TL-2026-001";


/* =========================================================
   DELIVERABLE DATA
========================================================= */

let deliverables = [

    {
        name:
            "CUSTOM AI VIDEOS",

        description:
            "Custom AI-generated video production",

        qty:
            8,

        amount:
            20000,

        status:
            "PENDING"
    },


    {
        name:
            "STATIC META POSTS",

        description:
            "Custom static creative for Meta",

        qty:
            3,

        amount:
            3000,

        status:
            "PAID"
    }

];


let brandLogoData = "";


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    return new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    ).format(
        Math.round(value || 0)
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {

        return "17 AUG 2026";

    }


    const date =
        new Date(
            value + "T00:00:00"
        );


    return date
        .toLocaleDateString(
            "en-GB",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        )
        .toUpperCase();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            function(character) {

                return {

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                }[character];

            }
        );

}


/* =========================================================
   GET CURRENCY
========================================================= */

function getCurrency() {

    return (
        $("currency")?.value ||
        "PKR"
    );

}


/* =========================================================
   RENDER EDITABLE DELIVERABLES
========================================================= */

function renderDeliverableEditors() {

    const container =
        $("deliverableEditors");


    if (!container) {

        return;

    }


    container.innerHTML =
        deliverables
            .map(
                function(item, index) {

                    return `

                        <div
                            class="deliverable-editor"
                        >

                            <div
                                class="deliverable-head"
                            >

                                <span
                                    class="deliverable-number"
                                >
                                    DELIVERABLE
                                    ${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </span>


                                <button
                                    type="button"
                                    class="remove-deliverable"
                                    onclick="removeDeliverable(${index})"
                                >
                                    ×
                                </button>

                            </div>


                            <div
                                class="form-field"
                            >

                                <label>
                                    Name
                                </label>

                                <input
                                    type="text"
                                    value="${escapeHTML(
                                        item.name
                                    )}"
                                    oninput="
                                        updateDeliverable(
                                            ${index},
                                            'name',
                                            this.value
                                        )
                                    "
                                >

                            </div>


                            <div
                                class="form-field"
                            >

                                <label>
                                    Description
                                </label>

                                <input
                                    type="text"
                                    value="${escapeHTML(
                                        item.description
                                    )}"
                                    oninput="
                                        updateDeliverable(
                                            ${index},
                                            'description',
                                            this.value
                                        )
                                    "
                                >

                            </div>


                            <div
                                class="two-columns"
                            >

                                <div
                                    class="form-field"
                                >

                                    <label>
                                        Qty
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value="${item.qty}"
                                        oninput="
                                            updateDeliverable(
                                                ${index},
                                                'qty',
                                                this.value
                                            )
                                        "
                                    >

                                </div>


                                <div
                                    class="form-field"
                                >

                                    <label>
                                        Amount
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value="${item.amount}"
                                        oninput="
                                            updateDeliverable(
                                                ${index},
                                                'amount',
                                                this.value
                                            )
                                        "
                                    >

                                </div>

                            </div>


                            <div
                                class="form-field"
                            >

                                <label>
                                    Payment Status
                                </label>

                                <select
                                    onchange="
                                        updateDeliverable(
                                            ${index},
                                            'status',
                                            this.value
                                        )
                                    "
                                >
                                    <option value="PENDING" ${item.status === "PENDING" ? "selected" : ""}>
                                        Pending
                                    </option>
                                    <option value="PAID" ${item.status === "PAID" ? "selected" : ""}>
                                        Paid
                                    </option>
                                    <option value="PARTIAL" ${item.status === "PARTIAL" ? "selected" : ""}>
                                        Partial
                                    </option>
                                    <option value="OVERDUE" ${item.status === "OVERDUE" ? "selected" : ""}>
                                        Overdue
                                    </option>
                                </select>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    renderDeliverableTable();

}


/* =========================================================
   UPDATE DELIVERABLE
========================================================= */

function updateDeliverable(
    index,
    property,
    value
) {

    if (!deliverables[index]) {

        return;

    }


    if (
        property === "qty" ||
        property === "amount"
    ) {

        deliverables[index][property] =
            Number(value) || 0;

    }

    else {

        deliverables[index][property] =
            value;

    }


    renderDeliverableTable();


    /*
       Update totals if required
    */

    updateInvoice();

}


/* =========================================================
   REMOVE DELIVERABLE
========================================================= */

function removeDeliverable(index) {

    if (!deliverables[index]) {

        return;

    }


    deliverables.splice(
        index,
        1
    );


    renderDeliverableEditors();

}


/* =========================================================
   ADD DELIVERABLE
========================================================= */

function addDeliverable() {

    deliverables.push({

        name:
            "NEW DELIVERABLE",

        description:
            "Description",

        qty:
            1,

        amount:
            0,

        status:
            "PENDING"

    });


    renderDeliverableEditors();

}


/* =========================================================
   RENDER INVOICE TABLE
========================================================= */

function renderDeliverableTable() {

    const table =
        $("deliverableRows");


    if (!table) {

        return;

    }


    const currency =
        getCurrency();


    table.innerHTML =
        deliverables
            .map(
                function(item, index) {

                    return `

                        <tr>

                            <td>

                                <span
                                    class="deliverable-name"
                                >

                                    ${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}

                                    &nbsp;

                                    ${escapeHTML(
                                        item.name ||
                                        "DELIVERABLE"
                                    )}

                                </span>

                            </td>


                            <td>

                                ${escapeHTML(
                                    item.description ||
                                    ""
                                )}

                            </td>


                            <td>

                                ${item.qty || 0}

                            </td>


                            <td>

                                ${currency}

                                ${formatMoney(
                                    item.amount
                                )}

                            </td>


                            <td>

                                <span
                                    class="deliverable-status ${(
                                        item.status || "PENDING"
                                    ).toLowerCase()}"
                                >
                                    ${(item.status || "PENDING").toUpperCase()}
                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   GENERATE QR
========================================================= */

function generateQR(
    invoiceNumber
) {

    const qrContainer =
        $("qr");


    if (!qrContainer) {

        return;

    }


    /*
       Delete old QR
    */

    qrContainer.innerHTML =
        "";


    /*
       Use the company website
       as QR destination
    */

    const qrValue =
        "https://www.thinklimitless.co/";


    /*
       Check QR library
    */

    if (
        typeof QRCode ===
        "undefined"
    ) {

        console.warn(
            "QRCode.js has not loaded."
        );

        return;

    }


    /*
       Generate QR
    */

    new QRCode(
        qrContainer,
        {

            text:
                qrValue,

            width:
                96,

            height:
                96,

            colorDark:
                "#111111",

            colorLight:
                "#ffffff",

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );

}


/* =========================================================
   UPDATE QR
========================================================= */

function updateQR() {

    const input =
        $("invoiceNo");


    let invoiceNumber =
        input?.value.trim();


    /*
       Use default only for
       preview if empty
    */

    if (!invoiceNumber) {

        invoiceNumber =
            DEFAULT_INVOICE;

    }


    /*
       Display invoice number
       above QR
    */

    if ($("qrNumber")) {

        $("qrNumber").textContent =
            invoiceNumber;

    }


    /*
       Generate unique QR
    */

    generateQR(
        invoiceNumber
    );

}


/* =========================================================
   UPDATE CLIENT
========================================================= */

function updateClient() {

    const client =
        $("client")?.value.trim();


    const address =
        $("address")?.value.trim();


    if ($("outClient")) {

        $("outClient").textContent =
            client ||
            "Client Name";

    }


    if ($("outAddress")) {

        $("outAddress").textContent =
            address ||
            "Client address";

    }

}


/* =========================================================
   UPDATE PROJECT
========================================================= */

function updateProject() {

    const project =
        $("project")?.value.trim() ||
        "Project Name";


    const client =
        $("client")?.value.trim() ||
        "CLIENT";


    const footerProject =
        $("footerProject");


    if (footerProject) {

        footerProject.value =
            footerProject.value.trim() ||
            project;

    }


    if ($("outProject")) {

        $("outProject").textContent =
            project;

    }


    if ($("outFooterProject")) {

        $("outFooterProject").textContent =
            footerProject?.value.trim() ||
            project;

    }


    if ($("footerRight")) {

        $("footerRight").textContent =
            (
                client +
                " · " +
                project
            ).toUpperCase();

    }

}


/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

function updatePaymentStatus() {

    const status =
        $("paymentStatus")?.value ||
        "DUE";


    const output =
        $("outStatus");


    if (!output) {

        return;

    }


    output.textContent =
        status;


    /*
       Reset status classes
    */

    output.classList.remove(
        "paid",
        "pending",
        "due"
    );


    /*
       Apply current class
    */

    output.classList.add(
        status.toLowerCase()
    );

}


/* =========================================================
   UPDATE DATE
========================================================= */

function updateInvoiceDate() {

    const output =
        $("outDate");


    if (!output) {

        return;

    }


    output.textContent =
        formatDate(
            $("invoiceDate")?.value
        );

}


/* =========================================================
   UPDATE PAYMENT TERMS
========================================================= */

function updatePaymentTerms() {

    if (!$("outTerms")) {

        return;

    }


    $("outTerms").textContent =
        $("terms")?.value ||
        "100% due on invoice";

}


/* =========================================================
   UPDATE BRANDING
========================================================= */

function updateBranding() {

    const brandName =
        $("brandName")?.value.trim() ||
        "THINKLIMITLESS";

    const brandTagline =
        $("brandTagline")?.value.trim() ||
        "AI · MEDIA · CREATIVITY";

    const logoPreview =
        $("outBrandLogo");


    if ($("outBrandName")) {

        $("outBrandName").textContent =
            brandName;

    }


    if ($("outBrandTagline")) {

        $("outBrandTagline").textContent =
            brandTagline;

    }


    if (logoPreview) {

        if (brandLogoData) {

            logoPreview.src =
                brandLogoData;

            logoPreview.classList.add(
                "has-image"
            );

        }

        else {

            logoPreview.removeAttribute(
                "src"
            );

            logoPreview.classList.remove(
                "has-image"
            );

        }

    }

}


/* =========================================================
   UPDATE FOOTER LEFT
========================================================= */

function updateFooter() {

    const footerText =
        $("footerLeft")?.value.trim();


    if ($("outFooterLeft")) {

        $("outFooterLeft").textContent =
            footerText ||
            "THINKLIMITLESS 2026";

    }

}


/* =========================================================
   DISCOUNT CONTROLS
========================================================= */

function updateDiscountControls() {

    const hasDiscount =
        $("hasDiscount");

    const discountBlock =
        $("discountBlock");

    const discountType =
        $("discountType");

    const discountInput =
        $("discount");

    const discountInputLabel =
        $("discountInputLabel");

    if (
        !hasDiscount ||
        !discountBlock ||
        !discountType ||
        !discountInput ||
        !discountInputLabel
    ) {

        return;

    }

    discountBlock.hidden =
        !hasDiscount.checked;

    if (discountType.value === "amount") {

        discountInputLabel.textContent =
            "Discount Amount";

        discountInput.max = "";

    } else {

        discountInputLabel.textContent =
            "Discount %";

        discountInput.max = "100";

    }

    if ($("discountRow")) {

        $("discountRow").style.display =
            hasDiscount.checked ?
                "flex" :
                "none";

    }

}


/* =========================================================
   DELIVERABLE TOTALS
========================================================= */

function getDeliverablesTotal() {

    return deliverables.reduce(
        function(total, item) {

            return total +
                (Number(item.amount) || 0);

        },
        0
    );

}


/* =========================================================
   CALCULATE COMMERCIAL TOTAL
========================================================= */

function calculateInvoice() {

    const currency =
        getCurrency();


    const fee =
        getDeliverablesTotal();


    if ($("fee")) {

        $("fee").value =
            fee;

    }


    const hasDiscount =
        $("hasDiscount")?.checked;

    const discountType =
        $("discountType")?.value ||
        "percent";

    let discount =
        Number(
            $("discount")?.value
        ) || 0;


    let tax =
        Number(
            $("tax")?.value
        ) || 0;


    if (!hasDiscount) {

        discount = 0;

    } else if (discountType === "percent") {

        discount =
            Math.min(
                100,
                Math.max(
                    0,
                    discount
                )
            );

    } else {

        discount =
            Math.max(
                0,
                discount
            );

    }


    tax =
        Math.max(
            0,
            tax
        );


    /*
       Calculate discount
    */

    const discountAmount =
        hasDiscount &&
        discountType === "percent"
            ? fee *
              discount /
              100
            : hasDiscount
                ? Math.min(
                    fee,
                    discount
                )
                : 0;


    /*
       Calculate subtotal
    */

    const subtotal =
        fee -
        discountAmount;


    /*
       Calculate tax
    */

    const taxAmount =
        subtotal *
        tax /
        100;


    /*
       Calculate total
    */

    const total =
        subtotal +
        taxAmount;


    /*
       Original fee
    */

    if ($("outFee")) {

        $("outFee").textContent =
            currency +
            " " +
            formatMoney(fee);

    }


    /*
       Discount
    */

    if ($("discountLabel")) {

        if (hasDiscount) {

            $("discountLabel").textContent =
                discountType === "amount"
                    ? "Discount"
                    : discount +
                      "% discount";

        } else {

            $("discountLabel").textContent =
                "0% discount";

        }

    }


    if ($("outDiscount")) {

        $("outDiscount").textContent =
            hasDiscount
                ? "− " +
                  currency +
                  " " +
                  formatMoney(
                      discountAmount
                  )
                : "− " +
                  currency +
                  " 0";

    }


    /*
       Tax
    */

    if ($("taxLabel")) {

        $("taxLabel").textContent =
            tax +
            "% tax";

    }


    if ($("outTax")) {

        $("outTax").textContent =
            "+ " +
            currency +
            " " +
            formatMoney(
                taxAmount
            );

    }


    /*
       Total
    */

    if ($("outTotal")) {

        $("outTotal").textContent =
            currency +
            " " +
            formatMoney(total);

    }

}


/* =========================================================
   MAIN UPDATE
========================================================= */

function updateInvoice() {

    updateClient();

    updateProject();

    updatePaymentStatus();

    updateInvoiceDate();

    updatePaymentTerms();

    updateBranding();

    updateFooter();

    updateDiscountControls();

    calculateInvoice();

    updateQR();

    renderDeliverableTable();

}


/* =========================================================
   CLEAR INVOICE
========================================================= */

function clearInvoice() {


    const fields = [

        "invoiceNo",

        "client",

        "address",

        "project",

        "terms",

        "footerLeft",

        "footerProject",

        "brandName",

        "brandTagline"

    ];


    fields.forEach(
        function(id) {

            if ($(id)) {

                $(id).value =
                    "";

            }

        }
    );


    const logoInput =
        $("brandLogo");


    if (logoInput) {

        logoInput.value =
            "";

    }


    brandLogoData =
        "";


    if ($("invoiceDate")) {

        $("invoiceDate").value =
            "";

    }


    if ($("dueDate")) {

        $("dueDate").value =
            "";

    }


    if ($("fee")) {

        $("fee").value =
            0;

    }


    if ($("hasDiscount")) {

        $("hasDiscount").checked =
            false;

    }


    if ($("discount")) {

        $("discount").value =
            0;

    }


    if ($("discountType")) {

        $("discountType").value =
            "percent";

    }


    if ($("tax")) {

        $("tax").value =
            0;

    }


    if ($("currency")) {

        $("currency").value =
            "PKR";

    }


    if ($("paymentStatus")) {

        $("paymentStatus").value =
            "DUE";

    }


    /*
       Clear deliverables
    */

    deliverables = [];


    renderDeliverableEditors();

    updateInvoice();

}


/* =========================================================
   PRINT / PDF
========================================================= */

function printInvoice() {

    window.print();

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {


        /*
           Find all editable fields
        */

        const fields =
            document.querySelectorAll(
                "input, select"
            );


        fields.forEach(
            function(field) {


                field.addEventListener(
                    "input",
                    updateInvoice
                );


                field.addEventListener(
                    "change",
                    updateInvoice
                );

            }
        );


        /*
           Add deliverable
        */

        const addButton =
            $("addDeliverable");


        if (addButton) {

            addButton.addEventListener(
                "click",
                addDeliverable
            );

        }


        /*
           Clear
        */

        const clearButton =
            $("clearBtn");


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearInvoice
            );

        }


        /*
           Print
        */

        const printButton =
            $("printBtn");


        if (printButton) {

            printButton.addEventListener(
                "click",
                printInvoice
            );

        }


        const logoInput =
            $("brandLogo");


        if (logoInput) {

            logoInput.addEventListener(
                "change",
                function(event) {

                    const file =
                        event.target.files?.[0];


                    if (!file) {

                        brandLogoData =
                            "";

                        updateBranding();

                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function(loadEvent) {

                            brandLogoData =
                                loadEvent.target.result;

                            updateBranding();

                        };


                    reader.readAsDataURL(file);

                }
            );

        }


        /*
           Initial rendering
        */

        renderDeliverableEditors();

        updateInvoice();

    }
);
