import { Translations } from "../shared/translations";
import * as Views from "../shared/views";

export const SIGN_FORM_LABEL = "sign-in-form";

export const CLASSES = {
    signInNameInputError: "mb-4",
    signInPasswordInputError: "mb-4"
};

export function signInPage(signInEndpoint: string,
    validateNameEndpoint: string,
    validatePasswordEndpoint: string,
    renderFullPage: boolean): string {

    const nameInput = Views.inputWithHiddenError({
        name: "name",
        placeholder: Translations.defaultLocale.signInPage.namePlaceholder,
        validateEndpoint: validateNameEndpoint,
        errorClasses: CLASSES.signInNameInputError
    });

    const passwordInput = Views.inputWithHiddenError({
        name: "password",
        placeholder: Translations.defaultLocale.signInPage.passwordPlaceholder,
        validateEndpoint: validatePasswordEndpoint,
        type: "password",
        errorClasses: CLASSES.signInPasswordInputError
    })

    const page = `
    <h1 class="p-4 text-2xl">Let's get some wisdom</h1>
    <form class="p-4 relative w-fit"
        hx-post="${signInEndpoint}"
        hx-target="#${Views.ROOT_ID}"
        hx-replace-url="/">
        ${nameInput}
        ${passwordInput}
        <input class="w-full px-8 py-4 ${Views.DISABLED_CLASS} rounded-lg ${Views.PROPS.bgColorBtn} ${Views.PROPS.txtColorBtn}" 
            type="submit" value="${Translations.defaultLocale.signInPage.signInButton}"
        ${Views.SUBMIT_FORM_LABEL}="${SIGN_FORM_LABEL}" disabled>
    </form>`;
    return renderFullPage ? Views.wrappedInMainPage(page, null) : page;
}